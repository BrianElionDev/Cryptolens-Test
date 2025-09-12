"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface PlatformStats {
  platform: string;
  accountType?: string;
  totalBalanceUSDT?: number;
  totalPortfolioValue?: number;
  totalWalletBalance?: number;
  totalUnrealizedProfit?: number;
  canTrade?: boolean;
  canWithdraw?: boolean;
  canDeposit?: boolean;
  balances?: Array<{
    asset: string;
    free: number;
    locked: number;
    total: number;
    usdValue: number;
  }>;
  lastUpdated?: string;
  error?: string;
}

interface PnLData {
  period: string;
  platform: string;
  summary: {
    totalPnL: number;
    totalTrades: number;
    profitableTrades: number;
    losingTrades: number;
    winRate: number;
    averagePnL: number;
  };
  bestTrade?: {
    pnl_usd: number;
    coin_symbol: string;
    trader: string;
    timestamp: string;
  };
  worstTrade?: {
    pnl_usd: number;
    coin_symbol: string;
    trader: string;
    timestamp: string;
  };
  topCoins: Array<{
    coin: string;
    totalPnL: number;
    tradeCount: number;
  }>;
  lastUpdated: string;
}

interface PlatformCardProps {
  platformStats: PlatformStats | null;
  pnlData: PnLData | null;
  pnlRange?: string;
  pnlCustomFrom?: string;
  pnlCustomTo?: string;
  onPnlRangeChange?: (value: string) => void;
  onPnlCustomFromChange?: (value: string) => void;
  onPnlCustomToChange?: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onPnlRefresh?: () => void;
}

export function PlatformCard({
  platformStats,
  pnlData,
  pnlRange,
  pnlCustomFrom,
  pnlCustomTo,
  onPnlRangeChange,
  onPnlCustomFromChange,
  onPnlCustomToChange,
  isLoading,
  error,
  onRefresh,
  onPnlRefresh,
}: PlatformCardProps) {


  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {platformStats?.platform || "Platform"} - Loading...
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-400">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-950/20 border-red-500/30 shadow-2xl">
        <CardHeader className="border-b border-red-500/30">
          <CardTitle className="text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {platformStats?.platform || "Platform"} - Error
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
      <CardHeader className="border-b border-gray-700 py-2 px-3">
        <CardTitle className="text-white flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="font-medium">
              {platformStats?.platform || "Platform"}
            </span>
            {platformStats?.accountType && (
              <Badge
                variant="outline"
                className="border-blue-500/50 text-blue-300 text-xs px-1.5 py-0.5"
              >
                {platformStats.accountType}
              </Badge>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-700/50 rounded transition-colors"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {/* Platform Stats */}
        {platformStats && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/30 rounded p-2 border border-gray-700/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-medium text-gray-300">
                    Wallet
                  </span>
                </div>
                <p className="text-sm font-bold text-green-300">
                  ${platformStats.totalWalletBalance?.toFixed(4) || "0.00"}
                </p>
              </div>

              <div className="bg-gray-800/30 rounded p-2 border border-gray-700/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-medium text-gray-300">Unrealized P&L</span>
                </div>
                <p
                  className={`text-sm font-bold ${
                    (platformStats.totalUnrealizedProfit || 0) >= 0
                      ? "text-green-300"
                      : "text-red-300"
                  }`}
                >
                  ${platformStats.totalUnrealizedProfit?.toFixed(4) || "0.00"}
                </p>
              </div>

              <div className="bg-gray-800/30 rounded p-2 border border-gray-700/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3 h-3 text-purple-400" />
                  <span className="text-xs font-medium text-gray-300">
                    Free
                  </span>
                </div>
                <p className="text-sm font-bold text-purple-300">
                  ${platformStats.balances?.[0]?.free?.toFixed(4) || "0.00"}
                </p>
              </div>

              <div className="bg-gray-800/30 rounded p-2 border border-gray-700/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-medium text-gray-300">
                    Locked
                  </span>
                </div>
                <p className="text-sm font-bold text-orange-300">
                  ${platformStats.balances?.[0]?.locked?.toFixed(4) || "0.00"}
                </p>
              </div>
            </div>

            {/* Account Permissions */}
            <div className="flex gap-1 flex-wrap">
              {platformStats.canTrade && (
                <Badge
                  variant="outline"
                  className="border-green-500/50 text-green-300 bg-green-900/20 text-xs px-1.5 py-0.5"
                >
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  Trade
                </Badge>
              )}
              {platformStats.canWithdraw && (
                <Badge
                  variant="outline"
                  className="border-blue-500/50 text-blue-300 bg-blue-900/20 text-xs px-1.5 py-0.5"
                >
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  Withdraw
                </Badge>
              )}
              {platformStats.canDeposit && (
                <Badge
                  variant="outline"
                  className="border-purple-500/50 text-purple-300 bg-purple-900/20 text-xs px-1.5 py-0.5"
                >
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  Deposit
                </Badge>
              )}
            </div>

            {/* Debug Info for Futures Not Activated */}
            {platformStats.platform === "Binance Futures" &&
              platformStats.totalPortfolioValue === 0 &&
              platformStats.totalBalanceUSDT === 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-300">
                      Futures Not Activated
                    </span>
                  </div>
                  <p className="text-xs text-yellow-200">
                    Activate futures trading or check spot balances.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* P&L Data - Compact with Range Filter */}
        <div className="border-t border-gray-700 pt-2 space-y-2">
          {/* P&L Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">P&L Range:</span>
            <Select
              value={pnlRange || "today"}
              onValueChange={onPnlRangeChange}
            >
              <SelectTrigger className="w-20 h-6 bg-gray-800/50 border-gray-600/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {onPnlRefresh && (
              <button
                onClick={onPnlRefresh}
                className="p-1 hover:bg-gray-700/50 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Custom Date Range */}
          {pnlRange === "custom" && (
            <div className="flex gap-1">
              <Input
                type="date"
                value={pnlCustomFrom || ""}
                onChange={(e) => onPnlCustomFromChange?.(e.target.value)}
                className="h-6 bg-gray-700/50 border-gray-600/50 text-xs text-white"
                placeholder="From"
              />
              <Input
                type="date"
                value={pnlCustomTo || ""}
                onChange={(e) => onPnlCustomToChange?.(e.target.value)}
                className="h-6 bg-gray-700/50 border-gray-600/50 text-xs text-white"
                placeholder="To"
              />
            </div>
          )}

          {/* P&L Metrics */}
          {pnlData && (
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="bg-gray-800/20 rounded p-1.5">
                <p className="text-xs text-gray-400 mb-0.5">Total P&L</p>
                <p
                  className={`text-sm font-bold ${
                    (pnlData.summary?.totalPnL || 0) > 0
                      ? "text-green-400"
                      : (pnlData.summary?.totalPnL || 0) < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  ${(pnlData.summary?.totalPnL || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800/20 rounded p-1.5">
                <p className="text-xs text-gray-400 mb-0.5">Trades</p>
                <p className="text-sm font-bold text-white">
                  {pnlData.summary?.totalTrades || 0}
                </p>
              </div>
              <div className="bg-gray-800/20 rounded p-1.5">
                <p className="text-xs text-gray-400 mb-0.5">Win Rate</p>
                <p className="text-sm font-bold text-blue-300">
                  {(pnlData.summary?.winRate || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {(platformStats?.lastUpdated || pnlData?.lastUpdated) && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
            Last updated:{" "}
            {new Date(
              platformStats?.lastUpdated || pnlData?.lastUpdated || ""
            ).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
