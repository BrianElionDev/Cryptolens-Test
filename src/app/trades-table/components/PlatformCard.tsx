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
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { usePlatformBalances } from "@/hooks/useBalances";

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
  platform: string;
  accountType?: string;
  pnlData: PnLData | null;
  pnlRange?: string;
  pnlLoading?: boolean;
  onPnlRangeChange?: (value: string) => void;
  onPnlRefresh?: () => void;
}

export function PlatformCard({
  platform,
  accountType,
  pnlData,
  pnlRange,
  pnlLoading,
  onPnlRangeChange,
  onPnlRefresh,
}: PlatformCardProps) {
  const {
    data: balanceData,
    isLoading,
    error,
    refetch,
  } = usePlatformBalances(platform, accountType);

  // Filter to only show data for this specific platform and account type
  const platformStats =
    balanceData?.find(
      (data) => data.platform === platform && data.accountType === accountType
    ) || null;

  if (isLoading) {
    return (
      <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {platform} - Loading...
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
              {platform} - Error
            </div>
            <button
              onClick={() => refetch()}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-300">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 border border-gray-700/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:border-gray-600/60">
      <CardHeader className="border-b border-gray-700/40 py-2 px-3 bg-gradient-to-r from-gray-800/20 to-gray-700/10">
        <CardTitle className="text-white flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Activity className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <span className="font-semibold text-white">
                {platform.toUpperCase()}
              </span>
              {accountType && (
                <Badge
                  variant="outline"
                  className="ml-2 border-blue-400/40 text-blue-200 bg-blue-500/10 text-xs px-2 py-0.5 backdrop-blur-sm"
                >
                  {accountType}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-700/40 rounded-lg transition-all duration-200 hover:scale-105"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-300 ${
                isLoading ? "animate-spin" : ""
              }`}
              style={{
                animation: isLoading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {/* Platform Stats - Modern & Complete */}
        {platformStats ? (
          <div className="space-y-2">
            {/* Balance Metrics - 2 Rows with Inline Labels */}
            <div className="space-y-2">
              {/* Row 1: Wallet & Unrealized P&L */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-lg p-2 border border-green-500/20 hover:border-green-400/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-green-400" />
                      <span className="text-xs font-medium text-gray-300">
                        Wallet
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-300">
                      ${platformStats.totalWalletBalance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-lg p-2 border border-blue-500/20 hover:border-blue-400/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                      <span className="text-xs font-medium text-gray-300">
                        P&L
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        (platformStats.totalUnrealizedProfit || 0) >= 0
                          ? "text-green-300"
                          : "text-red-300"
                      }`}
                    >
                      $
                      {platformStats.totalUnrealizedProfit?.toFixed(2) ||
                        "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Free & Locked */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 rounded-lg p-2 border border-purple-500/20 hover:border-purple-400/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-purple-400" />
                      <span className="text-xs font-medium text-gray-300">
                        Free
                      </span>
                    </div>
                    <span className="text-sm font-bold text-purple-300">
                      $
                      {platformStats.balances
                        ?.reduce((sum, b) => sum + b.free, 0)
                        ?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-lg p-2 border border-orange-500/20 hover:border-orange-400/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-medium text-gray-300">
                        Locked
                      </span>
                    </div>
                    <span className="text-sm font-bold text-orange-300">
                      $
                      {platformStats.balances
                        ?.reduce((sum, b) => sum + b.locked, 0)
                        ?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900/10 border border-yellow-500/20 rounded p-1 text-center">
            <p className="text-xs text-yellow-300">Loading...</p>
          </div>
        )}

        {/* P&L Data - Compact */}
        <div className="border-t border-gray-700/40 pt-2 space-y-2">
          {/* P&L Range Selector - Modern */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300">
                P&L Analysis
              </span>
              <Select
                value={pnlRange || "today"}
                onValueChange={(value) => onPnlRangeChange?.(value)}
              >
                <SelectTrigger className="w-24 h-8 bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-gray-600/40 text-sm hover:border-gray-500/60 transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {onPnlRefresh && (
              <button
                onClick={() => onPnlRefresh?.()}
                className="p-2 hover:bg-gray-700/40 rounded-lg transition-all duration-200 hover:scale-105"
                disabled={pnlLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-300 ${
                    pnlLoading ? "animate-spin" : ""
                  }`}
                  style={{
                    animation: pnlLoading ? "spin 1s linear infinite" : "none",
                  }}
                />
              </button>
            )}
          </div>

          {/* Removed custom date range for minimalism */}

          {/* P&L Metrics - 2 Rows with Inline Labels */}
          {pnlData ? (
            <div className="space-y-2">
              {/* Row 1: Total P&L & Trades */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-lg p-2 border border-emerald-500/20 hover:border-emerald-400/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-medium text-gray-300">
                        Total P&L
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        (pnlData.summary?.totalPnL || 0) > 0
                          ? "text-green-300"
                          : (pnlData.summary?.totalPnL || 0) < 0
                          ? "text-red-300"
                          : "text-gray-400"
                      }`}
                    >
                      ${(pnlData.summary?.totalPnL || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-lg p-2 border border-blue-500/20 hover:border-blue-400/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-blue-400" />
                      <span className="text-xs font-medium text-gray-300">
                        Trades
                      </span>
                    </div>
                    <span className="text-sm font-bold text-blue-300">
                      {pnlData.summary?.totalTrades || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Win Rate (centered) */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 rounded-lg p-2 border border-purple-500/20 hover:border-purple-400/30 transition-all duration-200 w-full max-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-purple-400" />
                      <span className="text-xs font-medium text-gray-300">
                        Win Rate
                      </span>
                    </div>
                    <span className="text-sm font-bold text-purple-300">
                      {(pnlData.summary?.winRate || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-xl p-4 text-center border border-gray-700/40">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-400">Loading P&L data...</p>
              </div>
            </div>
          )}
        </div>

        {/* Last Updated - Compact */}
        {platformStats?.lastUpdated && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700/40">
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>
                {new Date(platformStats.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
