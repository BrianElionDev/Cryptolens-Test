"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
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
  Search,
  Filter,
  ArrowUpDown,
  Activity,
} from "lucide-react";
import { Alert, Trade } from "@/types/wealthgroup";
import { formatInTimeZone } from "date-fns-tz";

interface TradingLogRow {
  id: string;
  timestamp: string;
  text_of_signal: string;
  state: string;
  coin: string;
  action_1: string;
  action_2: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchTradingLogData() {
  const { data, error } = await supabase
    .from("trading_log")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch trading log: ${error.message}`);
  }

  // Debug: Log the first row to see actual field names and data
  if (data && data.length > 0) {
    console.log("First row from trading_log:", data[0]);
    console.log("Available fields:", Object.keys(data[0]));
    console.log("All unique states:", [
      ...new Set(data.map((row: TradingLogRow) => row.state)),
    ]);
  }

  return data;
}

interface TradeEntry {
  id: string;
  type: "trade" | "alert";
  timestamp: string;
  content: string;
  state: string;
  coin: string;
  action_1: string;
  action_2: string | null;
  trade?: Trade;
  alert?: Alert;
  originalTradeId?: string;
}

export default function TradesTablePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [resultLimit, setResultLimit] = useState<number>(50);

  const { data, isLoading, error } = useQuery({
    queryKey: ["trading_log"],
    queryFn: fetchTradingLogData,
    refetchInterval: 30000,
  });

  // Create entries from trading_log view
  const allEntries = useMemo((): TradeEntry[] => {
    const tradingLogData = data || [];
    return tradingLogData.map((row: TradingLogRow) => {
      const isEntry = row.state === "entry";

      return {
        id: row.id,
        type: isEntry ? "trade" : "alert",
        timestamp: row.timestamp,
        content: row.text_of_signal,
        state: row.state,
        coin: row.coin,
        action_1: row.action_1,
        action_2: row.action_2,
        trade: isEntry
          ? {
              id: parseInt(row.id) || 0,
              discord_id: row.id,
              timestamp: row.timestamp,
              content: row.text_of_signal,
              structured: "",
              trader: "",
              parsed_signal: {
                coin_symbol: row.coin,
                position_type: row.action_1?.includes("LONG")
                  ? "LONG"
                  : "SHORT",
                entry_prices: row.action_1?.match(/[\d.]+/g)?.map(Number) || [],
                stop_loss: parseFloat(
                  row.action_2?.match(/[\d.]+/)?.[0] || "0"
                ),
                take_profits: null,
                order_type: "market",
                risk_level: null,
              },
            }
          : undefined,
        alert: !isEntry
          ? {
              discord_id: row.id,
              timestamp: row.timestamp,
              content: row.text_of_signal,
              trader: "",
              trade: "",
            }
          : undefined,
        originalTradeId: undefined,
      };
    });
  }, [data]);

  // Get unique states from database
  const tradeTypes = useMemo((): string[] => {
    const tradingLogData = data || [];
    const uniqueStates = new Set(
      tradingLogData.map((row: TradingLogRow) => row.state)
    );
    return Array.from(uniqueStates).sort();
  }, [data]);

  // Get unique coins
  const coins = useMemo((): string[] => {
    const uniqueCoins = new Set(
      allEntries
        .filter((entry) => entry.coin)
        .map((entry) => entry.coin.toLowerCase())
    );
    return Array.from(uniqueCoins).sort();
  }, [allEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    const filtered = allEntries.filter((entry: TradeEntry) => {
      const matchesSearch =
        searchTerm === "" ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.coin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState =
        selectedState === "all" || entry.state === selectedState;

      const matchesCoin = selectedCoin === "all" || entry.coin === selectedCoin;

      return matchesSearch && matchesState && matchesCoin;
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
    selectedState,
    selectedCoin,
    sortBy,
    resultLimit,
  ]);

  const getStateFromSignal = (trade: Trade, alert?: Alert) => {
    if (alert && alert.content) {
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
                placeholder="Search trades, coins, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-900/50 border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Types</SelectItem>
                  {tradeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
                      Action 1
                    </TableHead>
                    <TableHead className="text-gray-300 font-semibold min-w-[150px]">
                      Action 2
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
                            {entry.coin || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="text-yellow-300 text-sm truncate">
                            {entry.action_1 || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="text-red-300 text-sm truncate">
                            {entry.action_2 || "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">
                          {searchTerm ||
                          selectedState !== "all" ||
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
