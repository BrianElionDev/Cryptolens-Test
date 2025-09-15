import { NextRequest, NextResponse } from "next/server";
import supabase from "@/providers/supabaseprovider";
import { Balances } from "@/types/balances";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const accountType = searchParams.get("account_type");

    let query = supabase
      .from("balances")
      .select("*")
      .order("last_updated", { ascending: false });

    if (platform) {
      query = query.eq("platform", platform);
    }

    if (accountType) {
      query = query.eq("account_type", accountType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch balances" },
        { status: 500 }
      );
    }

    const balances: Balances[] = data || [];

    const groupedBalances = balances.reduce(
      (acc, balance) => {
        const key = `${balance.platform}-${balance.account_type}`;
        if (!acc[key]) {
          acc[key] = {
            platform: balance.platform,
            accountType: balance.account_type,
            balances: [],
            totalBalanceUSDT: 0,
            totalWalletBalance: 0,
            totalUnrealizedProfit: 0,
            lastUpdated: balance.last_updated,
          };
        }

        acc[key].balances.push({
          asset: balance.asset,
          free: balance.free,
          locked: balance.locked,
          total: balance.total,
          usdValue: balance.total * 1, // You might want to calculate actual USD value
        });

        acc[key].totalBalanceUSDT += balance.total;
        acc[key].totalWalletBalance += balance.total;
        acc[key].totalUnrealizedProfit += balance.unrealized_pnl || 0;

        return acc;
      },
      {} as Record<
        string,
        {
          platform: string;
          accountType: string;
          balances: Array<{
            asset: string;
            free: number;
            locked: number;
            total: number;
            usdValue: number;
          }>;
          totalBalanceUSDT: number;
          totalWalletBalance: number;
          totalUnrealizedProfit: number;
          lastUpdated: string;
        }
      >
    );

    const platformsData = Object.values(groupedBalances);

    // Get unique platforms for dynamic rendering
    const uniquePlatforms = platformsData.map((p) => ({
      platform: p.platform,
      accountType: p.accountType,
    }));

    return NextResponse.json({
      success: true,
      data: platformsData,
      platforms: uniquePlatforms,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
