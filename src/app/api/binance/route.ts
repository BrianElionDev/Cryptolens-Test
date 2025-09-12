import { NextResponse } from "next/server";
import { MainClient, USDMClient } from "binance";

const BINANCE_API_KEY = process.env.BINANCE_API_KEY!;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET!;

if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
  throw new Error("Missing Binance API credentials");
}

// Create Binance clients with proper configuration
const spotClient = new MainClient({
  api_key: BINANCE_API_KEY,
  api_secret: BINANCE_API_SECRET,
  baseUrl: "https://api.binance.com",
  recvWindow: 10000,
  disableTimeSync: false,
});

const futuresClient = new USDMClient({
  api_key: BINANCE_API_KEY,
  api_secret: BINANCE_API_SECRET,
  baseUrl: "https://fapi.binance.com",
  recvWindow: 10000,
  disableTimeSync: false,
});

export async function GET() {
  try {
    let nonZeroBalances: Array<{
      asset: string;
      free: number;
      locked: number;
      total: number;
      unrealizedProfit: number;
    }> = [];

    // --- Try FUTURES balances first ---
    try {
      const futuresAccount = await futuresClient.getAccountInformation();
      if (futuresAccount && futuresAccount.assets) {
        nonZeroBalances = futuresAccount.assets
          .filter(
            (a) =>
              parseFloat(String(a.walletBalance)) > 0 ||
              parseFloat(String(a.unrealizedProfit)) !== 0
          )
          .map((a) => ({
            asset: a.asset,
            free: parseFloat(String(a.availableBalance)),
            locked:
              parseFloat(String(a.walletBalance)) -
              parseFloat(String(a.availableBalance)),
            total: parseFloat(String(a.walletBalance)),
            unrealizedProfit: parseFloat(String(a.unrealizedProfit)),
          }));
      }
    } catch (err) {
      console.error("Futures account fetch error:", err);
    }

    // --- If no FUTURES balances, fallback to SPOT ---
    if (nonZeroBalances.length === 0) {
      try {
        const spotAccount = await spotClient.getBalances();
        if (spotAccount && Array.isArray(spotAccount)) {
          nonZeroBalances = spotAccount
            .filter(
              (a) =>
                parseFloat(String(a.free)) > 0 ||
                parseFloat(String(a.locked)) > 0
            )
            .map((a) => ({
              asset: a.coin,
              free: parseFloat(String(a.free)),
              locked: parseFloat(String(a.locked)),
              total: parseFloat(String(a.free)) + parseFloat(String(a.locked)),
              unrealizedProfit: 0, // no unrealized PnL in spot
            }));
        }
      } catch (spotErr) {
        console.error("Spot account fetch error:", spotErr);
      }
    }

    // --- Map balances with USD value (for simplicity only USDT is valued) ---
    const balancesWithUSD = nonZeroBalances.map((b) => ({
      ...b,
      usdValue: b.asset === "USDT" ? b.total : 0,
    }));

    const totalBalanceUSDT =
      balancesWithUSD.find((b) => b.asset === "USDT")?.total ?? 0;

    const totalPortfolioValue = balancesWithUSD.reduce(
      (sum, b) => sum + b.usdValue,
      0
    );

    const totalWalletBalance = balancesWithUSD.reduce(
      (sum, b) => sum + b.total,
      0
    );

    const totalUnrealizedProfit = balancesWithUSD.reduce(
      (sum, b) => sum + b.unrealizedProfit,
      0
    );

    return NextResponse.json({
      platform: nonZeroBalances.some((b) => b.unrealizedProfit !== 0)
        ? "Binance Futures"
        : "Binance Spot",
      accountType: nonZeroBalances.some((b) => b.unrealizedProfit !== 0)
        ? "FUTURES"
        : "SPOT",
      totalBalanceUSDT,
      totalPortfolioValue,
      totalWalletBalance,
      totalUnrealizedProfit,
      balances: balancesWithUSD,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Binance API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Binance data",
        details: error instanceof Error ? error.message : String(error),
        platform: "Binance",
      },
      { status: 500 }
    );
  }
}
