"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  TrendingUp,
  User,
  Search,
  Filter,
  ArrowUpDown,
  Activity,
} from "lucide-react";
import { Alert, Trade } from "@/types/wealthgroup";
import { formatInTimeZone } from "date-fns-tz";

async function fetchWealthgroupData() {
  const response = await fetch("/api/wealthgroup");
  if (!response.ok) {
    throw new Error("Failed to fetch wealthgroup data");
  }
  return response.json();
}

interface TradeEntry {
  id: string;
  type: "trade" | "alert";
  timestamp: string;
  content: string;
  trader: string;
  trade?: Trade;
  alert?: Alert;
  originalTradeId?: string;
}

export default function TradesTablePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrader, setSelectedTrader] = useState("all");
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [resultLimit, setResultLimit] = useState<number>(50);
  const [showFollowUpsOnly, setShowFollowUpsOnly] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["wealthgroup"],
    queryFn: fetchWealthgroupData,
    refetchInterval: 30000,
  });

  const { alerts = [], trades = [] } = data || {};

  // Create combined entries for trades and alerts
  const allEntries = useMemo((): TradeEntry[] => {
    const entries: TradeEntry[] = [];

    // Add all trades as entries
    trades.forEach((trade: Trade) => {
      entries.push({
        id: trade.discord_id,
        type: "trade",
        timestamp: trade.timestamp,
        content: trade.content,
        trader: trade.trader,
        trade: trade,
      });
    });

    // Add all alerts as entries
    alerts.forEach((alert: Alert) => {
      entries.push({
        id: alert.discord_id,
        type: "alert",
        timestamp: alert.timestamp,
        content: alert.content,
        trader: alert.trader,
        alert: alert,
        originalTradeId: alert.trade,
      });
    });

    return entries;
  }, [trades, alerts]);

  // Get unique traders
  const traders = useMemo((): string[] => {
    const uniqueTraders = new Set(allEntries.map((entry) => entry.trader));
    return Array.from(uniqueTraders).sort();
  }, [allEntries]);

  // Get unique coins
  const coins = useMemo((): string[] => {
    const uniqueCoins = new Set(
      allEntries
        .filter((entry) => entry.trade?.parsed_signal?.coin_symbol)
        .map((entry) => entry.trade!.parsed_signal!.coin_symbol as string)
    );
    return Array.from(uniqueCoins).sort() as string[];
  }, [allEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    const filtered = allEntries.filter((entry: TradeEntry) => {
      const matchesSearch =
        searchTerm === "" ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.trader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.trade?.parsed_signal?.coin_symbol
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesTrader =
        selectedTrader === "all" || entry.trader === selectedTrader;

      const matchesCoin =
        selectedCoin === "all" ||
        entry.trade?.parsed_signal?.coin_symbol === selectedCoin;

      const matchesFollowUps =
        showFollowUpsOnly === "all" ||
        (showFollowUpsOnly === "with_followups" && entry.type === "alert") ||
        (showFollowUpsOnly === "no_followups" && entry.type === "trade");

      return matchesSearch && matchesTrader && matchesCoin && matchesFollowUps;
    });

    const sorted = filtered.sort((a: TradeEntry, b: TradeEntry) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    // Apply result limit
    return sorted.slice(0, resultLimit);
  }, [
    allEntries,
    searchTerm,
    selectedTrader,
    selectedCoin,
    sortBy,
    resultLimit,
    showFollowUpsOnly,
  ]);

  const getStateFromSignal = (trade: Trade, alert?: Alert) => {
    if (alert) {
      const content = alert.content.toLowerCase();
      if (content.includes("sl to be") || content.includes("stop loss to be")) {
        return "SL to BE";
      }
      if (content.includes("tp1") || content.includes("take profit 1")) {
        return "TP1";
      }
      if (content.includes("tp2") || content.includes("take profit 2")) {
        return "TP2";
      }
      if (content.includes("tp3") || content.includes("take profit 3")) {
        return "TP3";
      }
      if (content.includes("close") || content.includes("exit")) {
        return "Close";
      }
      return "Follow Up";
    }
    return "Entry";
  };

  const getActionFromTrade = (trade: Trade) => {
    if (!trade.parsed_signal) return trade.content.substring(0, 50) + "...";

    const signal = trade.parsed_signal;
    const actions = [];

    if (
      signal.position_type &&
      signal.entry_prices &&
      signal.entry_prices.length > 0
    ) {
      actions.push(
        `${signal.position_type.toLowerCase()} at $${signal.entry_prices.join(
          ", $"
        )}`
      );
    }

    return actions.length > 0
      ? actions.join(", ")
      : trade.content.substring(0, 50) + "...";
  };

  const getAction2FromTrade = (trade: Trade) => {
    if (!trade.parsed_signal?.stop_loss) return "";
    return `stop loss $${trade.parsed_signal.stop_loss}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-black via-purple-950/20 to-black relative overflow-hidden flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-black via-purple-950/20 to-black relative overflow-hidden flex items-center justify-center">
        <Card className="bg-red-950/20 border-red-500/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-200 mb-2">
              Error Loading Data
            </h2>
            <p className="text-red-300">
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-16 pt-24 bg-gradient-to-br from-black via-purple-950/20 to-black relative overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-purple-400/5 rounded-full mix-blend-multiply filter blur-xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className=" mx-auto px-4  py-8 relative z-10 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Trading Journal
          </h1>
          <p className="text-gray-400 text-lg">
            Complete trade log with entry signals and follow-up alerts
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Entry Signal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>First Follow-up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Update</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Latest</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trades, traders, coins, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedTrader} onValueChange={setSelectedTrader}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-900/50 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by trader" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Traders</SelectItem>
                  {traders.map((trader) => (
                    <SelectItem key={trader} value={trader}>
                      {trader}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger className="w-full sm:w-[140px] bg-gray-900/50 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Coin" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Coins</SelectItem>
                  {coins.map((coin) => (
                    <SelectItem key={coin} value={coin}>
                      {coin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={showFollowUpsOnly}
                onValueChange={setShowFollowUpsOnly}
              >
                <SelectTrigger className="w-full sm:w-[160px] bg-gray-900/50 border-gray-700 text-white">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Follow-ups" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="with_followups">
                    With Follow-ups
                  </SelectItem>
                  <SelectItem value="no_followups">No Follow-ups</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "newest" | "oldest")
                }
              >
                <SelectTrigger className="w-full sm:w-[160px] bg-gray-900/50 border-gray-700 text-white">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by date" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={resultLimit.toString()}
                onValueChange={(value) => setResultLimit(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[120px] bg-gray-900/50 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="25">Show 25</SelectItem>
                  <SelectItem value="50">Show 50</SelectItem>
                  <SelectItem value="100">Show 100</SelectItem>
                  <SelectItem value="200">Show 200</SelectItem>
                  <SelectItem value="500">Show 500</SelectItem>
                  <SelectItem value="9999">Show All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Trade Log Table */}
        <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Trade Log ({filteredEntries.length} entries)
              </div>
              <div className="text-sm text-gray-400">
                {
                  filteredEntries.filter((entry) => entry.type === "alert")
                    .length
                }{" "}
                follow-ups total
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50 bg-gray-800/30">
                    <TableHead className="text-gray-300 w-[40px] font-semibold"></TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[120px]">
                      Date/Time (UAE)
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[300px]">
                      Text of Signal
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[80px]">
                      Asset
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[200px]">
                      Entry Action
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[150px]">
                      Risk Management
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[120px]">
                      Trader
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry: TradeEntry) => {
                    return (
                      <TableRow
                        key={entry.id}
                        className={`border-gray-700 hover:bg-gray-800/30 transition-colors ${
                          entry.type === "alert"
                            ? "bg-gradient-to-r from-slate-800/30 to-blue-900/20"
                            : ""
                        }`}
                      >
                        <TableCell>
                          {entry.type === "alert" && (
                            <div className="flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {formatInTimeZone(
                                new Date(entry.timestamp),
                                "Asia/Dubai",
                                "MMM dd, yyyy"
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatInTimeZone(
                                new Date(entry.timestamp),
                                "Asia/Dubai",
                                "HH:mm"
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="flex items-start gap-2">
                            {entry.type === "alert" && (
                              <div className="text-gray-500 text-xs font-mono mt-0.5">
                                └─
                              </div>
                            )}
                            <div
                              className="text-gray-200 text-sm leading-relaxed"
                              title={entry.content}
                            >
                              {entry.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.type === "trade"
                                ? "border-blue-500/50 text-blue-300"
                                : "border-green-500/50 text-green-300"
                            }
                          >
                            {entry.type === "trade"
                              ? "Entry"
                              : getStateFromSignal(entry.trade!, entry.alert)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-300 font-medium">
                            {entry.trade?.parsed_signal?.coin_symbol || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="text-yellow-300 text-sm truncate">
                            {entry.type === "trade"
                              ? getActionFromTrade(entry.trade!)
                              : "Update signal"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="text-red-300 text-sm truncate">
                            {entry.type === "trade"
                              ? getAction2FromTrade(entry.trade!)
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              entry.type === "trade"
                                ? "border-purple-500/50 text-purple-300"
                                : "border-gray-500/50 text-gray-400"
                            }
                          >
                            <User className="w-3 h-3 mr-1" />
                            {entry.trader}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">
                          {searchTerm ||
                          selectedTrader !== "all" ||
                          selectedCoin !== "all"
                            ? "No trades match your filters"
                            : "No trades available"}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
