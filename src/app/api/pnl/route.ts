import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "day"; // backward-compatible: "day" or "week"
    const platform = searchParams.get("platform") || "all"; // "binance", "kucoin", or "all"
    const range = searchParams.get("range"); // "today" | "7days" | "30days" | "yesterday"
    const fromParam = searchParams.get("from"); // ISO string
    const toParam = searchParams.get("to"); // ISO string

    // Calculate date range
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date = new Date(); // Use current date instead of now

    // 1) Custom range overrides
    if (fromParam || toParam) {
      const fromDate = fromParam ? new Date(fromParam) : null;
      const toDate = toParam ? new Date(toParam) : now;
      if (fromDate && !isNaN(fromDate.getTime())) {
        startDate = fromDate;
        endDate = toDate && !isNaN(toDate.getTime()) ? toDate : now;
      }
    }

    // 2) Named range
    if (!startDate && range) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      switch (range) {
        case "today": {
          startDate = today;
          endDate = now;
          break;
        }
        case "yesterday": {
          const y = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          startDate = y;
          endDate = new Date(y.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        }
        case "7days": {
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        }
        case "30days": {
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        }
      }
    }

    // 3) Backward-compatible period fallback
    if (!startDate) {
      if (period === "day") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "week") {
        const daysSinceMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
        startDate = new Date(
          now.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000
        );
        startDate.setHours(0, 0, 0, 0);
      } else {
        return NextResponse.json(
          { error: "Invalid period. Use 'day' or 'week'" },
          { status: 400 }
        );
      }
    }

    // Build query based on platform filter
    let query = supabase
      .from("trades")
      .select(
        "pnl_usd, net_pnl, timestamp, trader, coin_symbol, status, exchange"
      )
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString());

    // Apply platform filter if specified
    if (platform !== "all") {
      // Filter by exchange field (platform)
      const normalizedPlatform = platform.toLowerCase();
      query = query.eq("exchange", normalizedPlatform);
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error("P&L fetch error:", error);
      throw error;
    }

    // Calculate P&L metrics
    const totalPnL =
      trades?.reduce((sum, trade) => sum + (trade.pnl_usd || 0), 0) || 0;
    const totalNetPnL =
      trades?.reduce((sum, trade) => sum + (trade.net_pnl || 0), 0) || 0;
    const totalTrades = trades?.length || 0;
    const profitableTrades =
      trades?.filter((trade) => (trade.pnl_usd || 0) > 0).length || 0;
    const losingTrades =
      trades?.filter((trade) => (trade.pnl_usd || 0) < 0).length || 0;
    const winRate =
      totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    // Calculate average P&L
    const averagePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

    // Get best and worst trades
    let bestTrade: {
      pnl_usd: number;
      coin_symbol: string;
      trader: string;
      timestamp: string;
    } | null = null;
    let worstTrade: {
      pnl_usd: number;
      coin_symbol: string;
      trader: string;
      timestamp: string;
    } | null = null;

    if (trades && trades.length > 0) {
      bestTrade = trades.reduce((best, trade) =>
        (trade.pnl_usd || 0) > (best.pnl_usd || 0) ? trade : best
      );
      worstTrade = trades.reduce((worst, trade) =>
        (trade.pnl_usd || 0) < (worst.pnl_usd || 0) ? trade : worst
      );
    }

    // Calculate P&L by coin
    const pnlByCoin =
      trades?.reduce((acc, trade) => {
        const coin = trade.coin_symbol || "Unknown";
        if (!acc[coin]) {
          acc[coin] = { totalPnL: 0, tradeCount: 0 };
        }
        acc[coin].totalPnL += trade.pnl_usd || 0;
        acc[coin].tradeCount += 1;
        return acc;
      }, {} as Record<string, { totalPnL: number; tradeCount: number }>) || {};

    // Sort coins by P&L
    const topCoins = Object.entries(pnlByCoin)
      .sort(([, a], [, b]) => b.totalPnL - a.totalPnL)
      .slice(0, 5);

    return NextResponse.json({
      period,
      platform,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        netPnL: parseFloat(totalNetPnL.toFixed(2)),
        totalTrades,
        profitableTrades,
        losingTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        averagePnL: parseFloat(averagePnL.toFixed(2)),
      },
      bestTrade: bestTrade
        ? {
            pnl_usd: bestTrade.pnl_usd,
            coin_symbol: bestTrade.coin_symbol,
            trader: bestTrade.trader,
            timestamp: bestTrade.timestamp,
          }
        : null,
      worstTrade: worstTrade
        ? {
            pnl_usd: worstTrade.pnl_usd,
            coin_symbol: worstTrade.coin_symbol,
            trader: worstTrade.trader,
            timestamp: worstTrade.timestamp,
          }
        : null,
      topCoins: topCoins.map(([coin, data]) => ({
        coin,
        totalPnL: parseFloat(data.totalPnL.toFixed(2)),
        tradeCount: data.tradeCount,
      })),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("P&L API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch P&L data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
