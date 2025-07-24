"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ExternalLink,
} from "lucide-react";
import { Alert, Trade } from "@/types/wealthgroup";
import { formatInTimeZone } from "date-fns-tz";
import { BinanceResponseModal } from "@/components/modals/BinanceResponseModal";

interface TradingLogRow {
  id: string;
  timestamp: string;
  text_of_signal: string;
  state: string;
  coin: string;
  action_1: string;
  action_2: string;
}

interface TradesRow {
  id: number;
  discord_id: string;
  trader: string;
  content: string;
  structured: string;
  timestamp: string;
  trade_group_id: string;
  signal_type: string;
  is_active: boolean;
  status: string;
  position_size: number;
  exchange_order_id: string | null;
  exit_price: number | null;
  entry_price: number | null;
  binance_entry_price: number | null;
  binance_exit_price: number | null;
  binance_response: string | null;
  pnl_usd: number | null;
  parsed_signal: object;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchTradingLogData() {
  const { data, error } = await supabase
    .from("trading_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1000);

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

async function fetchTradesData() {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Failed to fetch trades: ${error.message}`);
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
  // Trading Log filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [resultLimit, setResultLimit] = useState<number>(9999);
  const [dateRange, setDateRange] = useState("all");

  // Trades tab filters
  const [tradesSearchTerm, setTradesSearchTerm] = useState("");
  const [selectedTrader, setSelectedTrader] = useState("all");
  const [selectedSignalType, setSelectedSignalType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedActiveStatus, setSelectedActiveStatus] = useState("all");
  const [tradesSortBy, setTradesSortBy] = useState<"newest" | "oldest">(
    "newest"
  );
  const [tradesResultLimit, setTradesResultLimit] = useState<number>(9999);
  const [tradesDateRange, setTradesDateRange] = useState("all");

  // Modal state
  const [selectedTrade, setSelectedTrade] = useState<TradesRow | null>(null);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [highlightedTradeId, setHighlightedTradeId] = useState<number | null>(
    null
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["trading_log"],
    queryFn: fetchTradingLogData,
    refetchInterval: 30000,
  });

  const {
    data: tradesData,
    isLoading: tradesLoading,
    error: tradesError,
  } = useQuery({
    queryKey: ["trades"],
    queryFn: fetchTradesData,
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

  // Get unique values for trades filters
  const traders = useMemo((): string[] => {
    if (!tradesData) return [];
    const uniqueTraders = new Set(
      tradesData
        .filter((trade: TradesRow) => trade.trader)
        .map((trade: TradesRow) => trade.trader)
    );
    return Array.from(uniqueTraders).sort();
  }, [tradesData]);

  const signalTypes = useMemo((): string[] => {
    if (!tradesData) return [];
    const uniqueSignalTypes = new Set(
      tradesData
        .filter((trade: TradesRow) => trade.signal_type)
        .map((trade: TradesRow) => trade.signal_type)
    );
    return Array.from(uniqueSignalTypes).sort();
  }, [tradesData]);

  const statuses = useMemo((): string[] => {
    if (!tradesData) return [];
    const uniqueStatuses = new Set(
      tradesData
        .filter((trade: TradesRow) => trade.status)
        .map((trade: TradesRow) => trade.status.toString())
    );
    return Array.from(uniqueStatuses).sort();
  }, [tradesData]);

  // Date range helper function
  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case "today":
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          from: yesterday,
          to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "7days":
        const sevenDaysAgo = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        return { from: sevenDaysAgo, to: now };
      case "30days":
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        return { from: thirtyDaysAgo, to: now };
      case "7daysago":
        const sevenDaysAgoStart = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        return {
          from: sevenDaysAgoStart,
          to: new Date(sevenDaysAgoStart.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "30daysago":
        const thirtyDaysAgoStart = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        return {
          from: thirtyDaysAgoStart,
          to: new Date(thirtyDaysAgoStart.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      default:
        return null;
    }
  };

  // Filter and sort entries for Trading Log
  const filteredEntries = useMemo(() => {
    const filtered = allEntries.filter((entry: TradeEntry) => {
      const matchesSearch =
        searchTerm === "" ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.coin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState =
        selectedState === "all" || entry.state === selectedState;

      const matchesCoin =
        selectedCoin === "all" ||
        entry.coin?.toLowerCase() === selectedCoin.toLowerCase();

      // Date range filtering
      const entryDate = new Date(entry.timestamp);
      const dateRangeFilter = getDateRange(dateRange);
      const matchesDateRange =
        !dateRangeFilter ||
        (entryDate >= dateRangeFilter.from && entryDate <= dateRangeFilter.to);

      return matchesSearch && matchesState && matchesCoin && matchesDateRange;
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
    dateRange,
  ]);

  // Filter and sort trades data
  const filteredTrades = useMemo(() => {
    if (!tradesData) return [];

    const filtered = tradesData.filter((trade: TradesRow) => {
      const matchesSearch =
        tradesSearchTerm === "" ||
        trade.content.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
        trade.trader.toLowerCase().includes(tradesSearchTerm.toLowerCase());

      const matchesTrader =
        selectedTrader === "all" || trade.trader === selectedTrader;

      const matchesSignalType =
        selectedSignalType === "all" ||
        trade.signal_type === selectedSignalType;

      const matchesStatus =
        selectedStatus === "all" || trade.status.toString() === selectedStatus;

      const matchesActiveStatus =
        selectedActiveStatus === "all" ||
        (selectedActiveStatus === "active" && trade.is_active) ||
        (selectedActiveStatus === "inactive" && !trade.is_active);

      // Date range filtering
      const tradeDate = new Date(trade.timestamp);
      const tradesDateRangeFilter = getDateRange(tradesDateRange);
      const matchesDateRange =
        !tradesDateRangeFilter ||
        (tradeDate >= tradesDateRangeFilter.from &&
          tradeDate <= tradesDateRangeFilter.to);

      return (
        matchesSearch &&
        matchesTrader &&
        matchesSignalType &&
        matchesStatus &&
        matchesActiveStatus &&
        matchesDateRange
      );
    });

    const sorted = filtered.sort((a: TradesRow, b: TradesRow) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return tradesSortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    // Apply result limit
    return sorted.slice(0, tradesResultLimit);
  }, [
    tradesData,
    tradesSearchTerm,
    selectedTrader,
    selectedSignalType,
    selectedStatus,
    selectedActiveStatus,
    tradesSortBy,
    tradesResultLimit,
    tradesDateRange,
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
    <div className="min-h-screen px-6 pt-24 bg-gradient-to-br from-black via-purple-950/20 to-black relative overflow-hidden">
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
        </div>

        <Tabs defaultValue="trading-log" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border-gray-700">
            <TabsTrigger
              value="trading-log"
              className="data-[state=active]:bg-gray-800"
            >
              Trading Log
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="data-[state=active]:bg-gray-800"
            >
              Trades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trading-log" className="mt-6">
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
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

            {/* Search and Filter Controls */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[250px] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search trades, coins, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>

                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-[160px] bg-gray-900/50 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Types</SelectItem>
                    {tradeTypes.map((type, index) => (
                      <SelectItem
                        key={`tradetype-${type}-${index}`}
                        value={type}
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger className="w-[120px] bg-gray-900/50 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Coin" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Coins</SelectItem>
                    {coins.map((coin, index) => (
                      <SelectItem key={`coin-${coin}-${index}`} value={coin}>
                        {coin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[150px] bg-gray-900/50 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) =>
                    setSortBy(value as "newest" | "oldest")
                  }
                >
                  <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={resultLimit.toString()}
                  onValueChange={(value) => setResultLimit(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px] bg-gray-900/50 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Show" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="9999">All</SelectItem>
                  </SelectContent>
                </Select>
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
                      {filteredEntries.map((entry: TradeEntry, index) => {
                        return (
                          <TableRow
                            key={`${entry.id}-${entry.type}-${index}`}
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
                                  : getStateFromSignal(
                                      entry.trade!,
                                      entry.alert
                                    )}
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
                        <TableRow key="empty-entries">
                          <TableCell colSpan={7} className="text-center py-8">
                            <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">
                              {searchTerm ||
                              selectedState !== "all" ||
                              selectedCoin !== "all" ||
                              dateRange !== "all"
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
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            {tradesLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : tradesError ? (
              <Card className="bg-red-950/20 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-red-200 mb-2">
                    Error Loading Trades
                  </h2>
                  <p className="text-red-300">
                    {tradesError instanceof Error
                      ? tradesError.message
                      : "Unknown error occurred"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Trades Search and Filter Controls */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[250px] relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search trades, content, or trader..."
                        value={tradesSearchTerm}
                        onChange={(e) => setTradesSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                      />
                    </div>

                    <Select
                      value={selectedTrader}
                      onValueChange={setSelectedTrader}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Trader" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Traders</SelectItem>
                        {traders.map((trader, index) => (
                          <SelectItem
                            key={`trader-${trader}-${index}`}
                            value={trader}
                          >
                            {trader}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedSignalType}
                      onValueChange={setSelectedSignalType}
                    >
                      <SelectTrigger className="w-[160px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Signal" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Types</SelectItem>
                        {signalTypes.map((type, index) => (
                          <SelectItem
                            key={`signaltype-${type}-${index}`}
                            value={type}
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="w-[120px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        {statuses.map((status, index) => (
                          <SelectItem
                            key={`status-${status}-${index}`}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedActiveStatus}
                      onValueChange={setSelectedActiveStatus}
                    >
                      <SelectTrigger className="w-[120px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Active" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={tradesDateRange}
                      onValueChange={setTradesDateRange}
                    >
                      <SelectTrigger className="w-[150px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={tradesSortBy}
                      onValueChange={(value) =>
                        setTradesSortBy(value as "newest" | "oldest")
                      }
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={tradesResultLimit.toString()}
                      onValueChange={(value) =>
                        setTradesResultLimit(parseInt(value))
                      }
                    >
                      <SelectTrigger className="w-[100px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Show" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="9999">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
                  <CardHeader className="border-b border-gray-700">
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Trades ({filteredTrades.length} of{" "}
                        {tradesData?.length || 0} entries)
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700 hover:bg-gray-800/50 bg-gray-800/30">
                            <TableHead className="text-gray-300 font-semibold min-w-[120px]">
                              Date/Time (UAE)
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Trader
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[250px]">
                              Content
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[120px]">
                              Signal Type
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Status
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Position Size
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Entry Price
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Exit Price
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              B. Entry Price
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              B. Exit Price
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              P&L (USD)
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[80px]">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrades.map((trade: TradesRow, index) => (
                            <TableRow
                              key={`trade-${trade.id}-${index}`}
                              className={`border-gray-700 hover:bg-gray-800/30 transition-colors ${
                                selectedTrade?.id === trade.id &&
                                showBinanceModal
                                  ? "bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/20"
                                  : highlightedTradeId === trade.id
                                  ? "bg-blue-500/20 border-blue-500/20"
                                  : ""
                              }`}
                            >
                              <TableCell className="font-mono text-sm text-gray-300">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {formatInTimeZone(
                                      new Date(trade.timestamp),
                                      "Asia/Dubai",
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatInTimeZone(
                                      new Date(trade.timestamp),
                                      "Asia/Dubai",
                                      "HH:mm"
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-orange-500/50 text-orange-300 bg-orange-900/50"
                                >
                                  {trade.trader}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[250px]">
                                <div
                                  className="text-gray-200 text-sm leading-relaxed truncate"
                                  title={trade.content}
                                >
                                  {trade.content}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    trade.signal_type === "LONG"
                                      ? "border-purple-500/50 text-purple-300"
                                      : trade.signal_type === "SHORT"
                                      ? "border-cyan-500/50 text-cyan-300"
                                      : "border-gray-500/50 text-gray-300"
                                  }
                                >
                                  {trade.signal_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={(() => {
                                    const status = trade.status
                                      ?.toString()
                                      .trim()
                                      .toUpperCase();
                                    switch (status) {
                                      case "OPEN":
                                        return "border-green-500/50 text-green-300";
                                      case "CLOSED":
                                        return "border-red-500/50 text-red-300";
                                      case "PARTIALLY_CLOSED":
                                        return "border-blue-500/50 text-blue-300";
                                      case "PENDING":
                                        return "border-yellow-500/50 text-yellow-300";
                                      case "UNFILLED":
                                        return "border-cyan-500/50 text-cyan-300";
                                      default:
                                        return "border-gray-500/50 text-gray-400";
                                    }
                                  })()}
                                >
                                  {trade.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {trade.position_size === null ? (
                                  "-"
                                ) : (
                                  <span className="text-green-300">
                                    {trade.position_size}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-blue-300 font-medium">
                                {trade.entry_price && trade.entry_price > 0
                                  ? `$${trade.entry_price}`
                                  : trade.entry_price && trade.entry_price < 0
                                  ? `-$${Math.abs(trade.entry_price)}`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-purple-400 font-medium">
                                {trade.exit_price
                                  ? `$${trade.exit_price}`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-blue-200 font-medium">
                                {trade.binance_entry_price
                                  ? `$${trade.binance_entry_price}`
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-purple-200 font-medium">
                                {trade.binance_exit_price
                                  ? `$${trade.binance_exit_price}`
                                  : "-"}
                              </TableCell>
                              <TableCell
                                className={`font-medium ${
                                  trade.pnl_usd
                                    ? trade.pnl_usd > 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {trade.pnl_usd ? `$${trade.pnl_usd}` : "-"}
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={(e) => {
                                    const rect =
                                      e.currentTarget.getBoundingClientRect();
                                    const tableContainer =
                                      e.currentTarget.closest(
                                        ".overflow-x-auto"
                                      );
                                    const tableRect =
                                      tableContainer?.getBoundingClientRect();
                                    const viewportWidth = window.innerWidth;
                                    const viewportHeight = window.innerHeight;

                                    // Position modal to align with table
                                    let x = rect.left;
                                    let y = rect.top + rect.height + 10; // 10px below the button

                                    // Check if modal would go off-screen and adjust
                                    const modalWidth = 400;
                                    const modalHeight = 500; // Increased height estimate

                                    // Horizontal positioning - prioritize viewport boundaries
                                    if (x + modalWidth > viewportWidth) {
                                      x = viewportWidth - modalWidth - 20; // 20px margin from right
                                    }
                                    if (x < 20) {
                                      x = 20; // 20px margin from left
                                    }

                                    // Vertical positioning - check both table and viewport
                                    if (y + modalHeight > viewportHeight) {
                                      // Try to show above the button first
                                      y = rect.top - modalHeight - 10;

                                      // If still off-screen, position at top of viewport
                                      if (y < 20) {
                                        y = 20;
                                      }
                                    }

                                    // If table container exists, make final adjustments within table bounds
                                    if (tableRect) {
                                      // Ensure modal doesn't go outside table horizontally
                                      if (x + modalWidth > tableRect.right) {
                                        x = tableRect.right - modalWidth - 10;
                                      }
                                      if (x < tableRect.left) {
                                        x = tableRect.left + 10;
                                      }
                                    }

                                    setModalPosition({ x, y });
                                    setSelectedTrade(trade);
                                    setShowBinanceModal(true);
                                    setHighlightedTradeId(trade.id);

                                    // Ensure the modal is visible by scrolling if needed
                                    setTimeout(() => {
                                      const modalElement =
                                        document.querySelector(
                                          '[data-modal="binance-response"]'
                                        );
                                      if (modalElement) {
                                        modalElement.scrollIntoView({
                                          behavior: "smooth",
                                          block: "nearest",
                                          inline: "nearest",
                                        });
                                      }
                                    }, 100);
                                  }}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    selectedTrade?.id === trade.id &&
                                    showBinanceModal
                                      ? "bg-blue-500/20 text-blue-200 border border-blue-500/50 shadow-lg shadow-blue-500/20"
                                      : highlightedTradeId === trade.id
                                      ? "bg-blue-500/30 text-blue-300 border border-blue-500/30"
                                      : "hover:bg-gray-800/50 text-gray-400 hover:text-blue-300 border border-transparent hover:border-blue-500/30"
                                  }`}
                                  title="View Binance Response"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredTrades.length === 0 && (
                            <TableRow key="empty-trades">
                              <TableCell
                                colSpan={10}
                                className="text-center py-8"
                              >
                                <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">
                                  {tradesSearchTerm ||
                                  selectedTrader !== "all" ||
                                  selectedSignalType !== "all" ||
                                  selectedStatus !== "all" ||
                                  selectedActiveStatus !== "all" ||
                                  tradesDateRange !== "all"
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
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Binance Response Modal */}
      {showBinanceModal && selectedTrade && (
        <BinanceResponseModal
          trade={selectedTrade}
          position={modalPosition}
          onClose={() => {
            setShowBinanceModal(false);
            setSelectedTrade(null);
          }}
        />
      )}
    </div>
  );
}
