import { NextResponse } from "next/server";
import Binance from "binance-api-node";

interface FuturesAccountAsset {
  asset: string;
  walletBalance: string;
  availableBalance: string;
  unrealizedProfit: string;
}

interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
}

const BINANCE_API_KEY = process.env.BINANCE_API_KEY!;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET!;

if (!BINANCE_API_KEY || !BINANCE_API_SECRET) {
  throw new Error("Missing Binance API credentials");
}

// Initialize Binance client
const client = Binance({
  apiKey: BINANCE_API_KEY,
  apiSecret: BINANCE_API_SECRET,
});

export async function GET() {
  try {
    // Try futures account endpoint (same as Python script)
    let accountInfo;
    try {
      accountInfo = await client.futuresAccountInfo();
    } catch (error) {
      console.error("Futures account info error:", error);
      // If futures is not activated, return empty data
      accountInfo = {
        assets: [],
        totalWalletBalance: 0,
        totalUnrealizedProfit: 0,
        canTrade: false,
        canWithdraw: false,
        canDeposit: false,
      };
    }

    // Extract balances (handle futures account response format)
    let nonZeroBalances: Array<{
      asset: string;
      free: number;
      locked: number;
      total: number;
      unrealizedProfit: number;
    }>;

    if (accountInfo.assets && Array.isArray(accountInfo.assets)) {
      // Futures account endpoint response format (same as Python script)
      nonZeroBalances = accountInfo.assets
        .filter(
          (asset: FuturesAccountAsset) =>
            parseFloat(asset.walletBalance) > 0 ||
            parseFloat(asset.unrealizedProfit) !== 0
        )
        .map((asset: FuturesAccountAsset) => ({
          asset: asset.asset,
          free: parseFloat(asset.availableBalance),
          locked:
            parseFloat(asset.walletBalance) -
            parseFloat(asset.availableBalance),
          total: parseFloat(asset.walletBalance),
          unrealizedProfit: parseFloat(asset.unrealizedProfit),
        }));
    } else {
      // Futures not activated - return empty balances
      nonZeroBalances = [];
    }

    // If no futures balances found, try spot balances as fallback
    if (nonZeroBalances.length === 0) {
      try {
        const spotAccountInfo = await client.accountInfo();

        if (spotAccountInfo.balances) {
          nonZeroBalances = spotAccountInfo.balances
            .filter(
              (asset: SpotBalance) =>
                parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0
            )
            .map((asset: SpotBalance) => ({
              asset: asset.asset,
              free: parseFloat(asset.free),
              locked: parseFloat(asset.locked),
              total: parseFloat(asset.free) + parseFloat(asset.locked),
              unrealizedProfit: 0, // Spot accounts don't have unrealized profit
            }));
        }
      } catch (spotError) {
        console.error("Spot account info error:", spotError);
        // Silently handle spot balance check failure
      }
    }

    const balancesWithUSD = nonZeroBalances.map((balance) => {
      const usdValue = balance.asset === "USDT" ? balance.total : 0;
      return { ...balance, usdValue };
    });

    const totalPortfolioValue = balancesWithUSD.reduce(
      (sum: number, b: { usdValue: number }) => sum + b.usdValue,
      0
    );

    const usdtBalance = balancesWithUSD.find(
      (b: { asset: string }) => b.asset === "USDT"
    );
    const totalBalanceUSDT = usdtBalance ? usdtBalance.total : 0;

    // Calculate total wallet balance and unrealized profit from actual balance data
    const totalWalletBalance = balancesWithUSD.reduce(
      (sum: number, b: { total: number }) => sum + b.total,
      0
    );
    const totalUnrealizedProfit = balancesWithUSD.reduce(
      (sum: number, b: { unrealizedProfit: number }) =>
        sum + b.unrealizedProfit,
      0
    );

    // Determine API type used
    let apiType = "futures-not-activated";
    if (accountInfo.assets && Array.isArray(accountInfo.assets)) {
      apiType = "futures-account";
    }

    const isSpotData = apiType === "spot-account";
    const platformName = isSpotData ? "Binance Spot" : "Binance Futures";
    const accountType = isSpotData ? "SPOT" : "FUTURES";

    return NextResponse.json({
      platform: platformName,
      accountType: accountType,
      totalBalanceUSDT,
      totalPortfolioValue,
      totalUnrealizedProfit,
      totalWalletBalance,
      canTrade: accountInfo.canTrade ?? false,
      canWithdraw: accountInfo.canWithdraw ?? false,
      canDeposit: accountInfo.canDeposit ?? false,
      balances: balancesWithUSD,
      apiType,
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
