"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Alert, Trade } from "@/types/wealthgroup";
import { ActiveFutures } from "@/types/active_futures";
import { formatInTimeZone } from "date-fns-tz";
import { ExchangeResponseModal } from "./components/ExchangeResponseModal";
import { DynamicPlatformCards } from "./components/DynamicPlatformCards";

interface Transaction {
  time: string;
  type: string;
  amount: number;
  asset: string;
  symbol: string;
  exchange?: string;
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
  order_status: string;
  coin_symbol: string;
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
  exchange: string | null;
}

async function fetchWealthgroupData() {
  const response = await fetch("/api/wealthgroup");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch wealthgroup data");
  }

  return await response.json();
}

async function fetchTransactionHistory(params: {
  type?: string;
  asset?: string;
  symbol?: string;
  exchange?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/transactions?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch transaction history");
  }

  return await response.json();
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

async function fetchActiveFutures() {
  const response = await fetch("/api/active_futures");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch active futures data");
  }

  return await response.json();
}

// Removed old API functions - now using dynamic platform cards

export default function TradesTablePage() {
  // Trading Log filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [selectedTraderLog, setSelectedTraderLog] = useState("@Johnny");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [resultLimit, setResultLimit] = useState<number>(9999);
  const [dateRange, setDateRange] = useState("all");

  // Trades tab filters
  const [tradesSearchTerm, setTradesSearchTerm] = useState("");
  const [selectedTrader, setSelectedTrader] = useState("@Johnny");
  const [selectedSignalType, setSelectedSignalType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCoinTrades, setSelectedCoinTrades] = useState("all");
  const [selectedExchange, setSelectedExchange] = useState("all");
  const [tradesSortBy, setTradesSortBy] = useState<"newest" | "oldest">(
    "newest"
  );
  const [tradesResultLimit, setTradesResultLimit] = useState<number>(9999);
  const [tradesDateRange, setTradesDateRange] = useState("all");

  // Active Futures tab filters
  const [activeFuturesSearchTerm, setActiveFuturesSearchTerm] = useState("");
  const [selectedActiveFuturesTrader, setSelectedActiveFuturesTrader] =
    useState("@Johnny");
  const [selectedActiveFuturesStatus, setSelectedActiveFuturesStatus] =
    useState("all");
  const [activeFuturesSortBy, setActiveFuturesSortBy] = useState<
    "newest" | "oldest"
  >("newest");
  const [activeFuturesResultLimit, setActiveFuturesResultLimit] =
    useState<number>(9999);
  const [activeFuturesDateRange, setActiveFuturesDateRange] = useState("all");

  // Transaction history tab filters
  const [transactionsSearchTerm, setTransactionsSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState("");
  const [selectedTransactionType, setSelectedTransactionType] = useState("all");
  const [selectedTransactionAsset, setSelectedTransactionAsset] =
    useState("all");
  const [selectedTransactionSymbol, setSelectedTransactionSymbol] =
    useState("all");
  const [selectedTransactionExchange, setSelectedTransactionExchange] =
    useState("all");
  const [transactionsSortBy, setTransactionsSortBy] = useState<
    "newest" | "oldest"
  >("newest");
  const [transactionsResultLimit, setTransactionsResultLimit] =
    useState<number>(9999);
  const [transactionsDateRange, setTransactionsDateRange] = useState("all");

  // Handle clear search
  const handleClearSearch = () => {
    setTransactionsSearchTerm("");
    setSubmittedSearchTerm("");
  };

  // Modal state
  const [selectedTrade, setSelectedTrade] = useState<TradesRow | null>(null);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [highlightedTradeId, setHighlightedTradeId] = useState<number | null>(
    null
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["wealthgroup_data"],
    queryFn: fetchWealthgroupData,
    refetchInterval: 60000, // 1 minute
  });

  // Transaction history query
  const {
    data: transactionData,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery({
    queryKey: [
      "transaction_history",
      submittedSearchTerm,
      transactionsDateRange,
      selectedTransactionType,
      selectedTransactionAsset,
      selectedTransactionSymbol,
      selectedTransactionExchange,
      transactionsSortBy,
      transactionsResultLimit,
    ],
    queryFn: () =>
      fetchTransactionHistory({
        search: submittedSearchTerm || undefined,
        dateFrom: getDateRange(transactionsDateRange)?.from?.toISOString(),
        dateTo: getDateRange(transactionsDateRange)?.to?.toISOString(),
        type:
          selectedTransactionType !== "all"
            ? selectedTransactionType
            : undefined,
        asset:
          selectedTransactionAsset !== "all"
            ? selectedTransactionAsset
            : undefined,
        symbol:
          selectedTransactionSymbol !== "all"
            ? selectedTransactionSymbol
            : undefined,
        exchange:
          selectedTransactionExchange !== "all"
            ? selectedTransactionExchange
            : undefined,
        sortBy: "time",
        sortOrder: transactionsSortBy === "newest" ? "DESC" : "ASC",
        limit: transactionsResultLimit,
      }),
    refetchInterval: 60000, // 1 minute
  });

  // Active futures query
  const {
    data: activeFuturesData,
    isLoading: activeFuturesLoading,
    error: activeFuturesError,
  } = useQuery({
    queryKey: ["active_futures"],
    queryFn: fetchActiveFutures,
    refetchInterval: 60000, // 1 minute
  });

  // Portfolio queries
  // Removed individual platform queries - now using dynamic platform cards

  // Expanded rows state for trades
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (tradeId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(tradeId)) {
      newExpandedRows.delete(tradeId);
    } else {
      newExpandedRows.add(tradeId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Process wealthgroup data
  const tradesData = useMemo(() => {
    if (!data?.trades) return [];
    return data.trades;
  }, [data]);

  const alertsData = useMemo(() => {
    if (!data?.alerts) return [];
    return data.alerts;
  }, [data]);

  // Create entries from wealthgroup data
  const allEntries = useMemo((): TradeEntry[] => {
    const trades = tradesData || [];
    const alerts = alertsData || [];

    const tradeEntries: TradeEntry[] = trades.map((trade: Trade) => ({
      id: trade.id.toString(),
      type: "trade" as const,
      timestamp: trade.timestamp,
      content: trade.content,
      state: "entry",
      coin: trade.parsed_signal?.coin_symbol || "",
      action_1: trade.parsed_signal?.entry_prices?.join(", ") || "",
      action_2: trade.parsed_signal?.stop_loss?.toString() || null,
      trade: trade,
      originalTradeId: trade.id,
    }));

    const alertEntries: TradeEntry[] = alerts.map((alert: Alert) => ({
      id: alert.discord_id,
      type: "alert" as const,
      timestamp: alert.timestamp,
      content: alert.content,
      state: "alert",
      coin: alert.parsed_alert?.coin_symbol || "",
      action_1: alert.parsed_alert?.action_determined?.action_description || "",
      action_2:
        alert.parsed_alert?.action_determined?.stop_loss?.toString() || null,
      alert: alert,
      originalTradeId: alert.trade, // trade field contains the discord_id of the related trade
    }));

    return [...tradeEntries, ...alertEntries];
  }, [tradesData, alertsData]);

  // Get unique states from database
  const tradeTypes = useMemo((): string[] => {
    const uniqueStates = new Set(allEntries.map((entry) => entry.state));
    return Array.from(uniqueStates).sort() as string[];
  }, [allEntries]);

  // Get unique coins
  const coins = useMemo((): string[] => {
    const uniqueCoins = new Set(
      allEntries
        .filter((entry) => entry.coin)
        .map((entry) => entry.coin.toUpperCase())
    );
    return Array.from(uniqueCoins).sort() as string[];
  }, [allEntries]);

  // Get unique values for trades filters
  const traders = useMemo((): string[] => {
    const uniqueTraders = new Set(
      tradesData
        .filter((trade: Trade) => trade.trader)
        .map((trade: Trade) => trade.trader)
    );
    return Array.from(uniqueTraders).sort() as string[];
  }, [tradesData]);

  const exchanges = useMemo((): string[] => {
    const uniqueExchanges = new Set(
      tradesData
        .filter((trade: Trade) => trade.exchange)
        .map((trade: Trade) => trade.exchange)
    );
    return Array.from(uniqueExchanges).sort() as string[];
  }, [tradesData]);

  const signalTypes = useMemo((): string[] => {
    const uniqueSignalTypes = new Set(
      tradesData
        .filter((trade: Trade) => trade.parsed_signal?.position_type)
        .map((trade: Trade) => trade.parsed_signal!.position_type)
    );
    return Array.from(uniqueSignalTypes).sort() as string[];
  }, [tradesData]);

  // Get unique statuses for trades
  const statuses = useMemo((): string[] => {
    const uniqueStatuses = new Set(
      tradesData
        .filter((trade: Trade) => trade.status)
        .map((trade: Trade) => trade.status)
    );
    return Array.from(uniqueStatuses).sort() as string[];
  }, [tradesData]);

  // Get unique values for transaction filters
  const transactionTypes = useMemo((): string[] => {
    const uniqueTypes = new Set(
      transactionData?.transactions
        ?.filter((transaction: Transaction) => transaction.type)
        .map((transaction: Transaction) => transaction.type) || []
    );
    return Array.from(uniqueTypes).sort() as string[];
  }, [transactionData]);

  const transactionAssets = useMemo((): string[] => {
    const uniqueAssets = new Set(
      transactionData?.transactions
        ?.filter((transaction: Transaction) => transaction.asset)
        .map((transaction: Transaction) => transaction.asset) || []
    );
    return Array.from(uniqueAssets).sort() as string[];
  }, [transactionData]);

  const transactionSymbols = useMemo((): string[] => {
    const uniqueSymbols = new Set(
      transactionData?.transactions
        ?.filter((transaction: Transaction) => transaction.symbol)
        .map((transaction: Transaction) => transaction.symbol) || []
    );
    return Array.from(uniqueSymbols).sort() as string[];
  }, [transactionData]);

  // Get unique values for active futures filters
  const activeFuturesTraders = useMemo((): string[] => {
    const uniqueTraders = new Set(
      activeFuturesData
        ?.filter((future: ActiveFutures) => future.trader)
        .map((future: ActiveFutures) => future.trader) || []
    );
    return Array.from(uniqueTraders).sort() as string[];
  }, [activeFuturesData]);

  const activeFuturesStatuses = useMemo((): string[] => {
    const uniqueStatuses = new Set(
      activeFuturesData
        ?.filter((future: ActiveFutures) => future.status)
        .map((future: ActiveFutures) => future.status) || []
    );
    return Array.from(uniqueStatuses).sort() as string[];
  }, [activeFuturesData]);

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

      const matchesTrader =
        selectedTraderLog === "all" ||
        entry.trade?.trader === selectedTraderLog ||
        entry.alert?.trader === selectedTraderLog;

      // Date range filtering
      const entryDate = new Date(entry.timestamp);
      const dateRangeFilter = getDateRange(dateRange);
      const matchesDateRange =
        !dateRangeFilter ||
        (entryDate >= dateRangeFilter.from && entryDate <= dateRangeFilter.to);

      return (
        matchesSearch &&
        matchesState &&
        matchesCoin &&
        matchesTrader &&
        matchesDateRange
      );
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
    selectedTraderLog,
    sortBy,
    resultLimit,
    dateRange,
  ]);

  // Filter and sort trades data
  const filteredTrades = useMemo(() => {
    const filtered = tradesData.filter((trade: Trade) => {
      const matchesSearch =
        tradesSearchTerm === "" ||
        trade.content.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
        trade.trader.toLowerCase().includes(tradesSearchTerm.toLowerCase()) ||
        trade.parsed_signal?.coin_symbol
          ?.toLowerCase()
          .includes(tradesSearchTerm.toLowerCase());

      const matchesTrader =
        selectedTrader === "all" || trade.trader === selectedTrader;

      const matchesSignalType =
        selectedSignalType === "all" ||
        trade.parsed_signal?.position_type === selectedSignalType;

      const matchesStatus =
        selectedStatus === "all" || trade.status === selectedStatus;

      const matchesCoin =
        selectedCoinTrades === "all" ||
        trade.parsed_signal?.coin_symbol?.toUpperCase() ===
          selectedCoinTrades.toUpperCase();

      const matchesExchange =
        selectedExchange === "all" || trade.exchange === selectedExchange;

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
        matchesCoin &&
        matchesExchange &&
        matchesDateRange
      );
    });

    const sorted = filtered.sort((a: Trade, b: Trade) => {
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
    selectedCoinTrades,
    selectedExchange,
    tradesSortBy,
    tradesResultLimit,
    tradesDateRange,
  ]);

  // Filter and sort active futures data
  const filteredActiveFutures = useMemo(() => {
    const filtered = (activeFuturesData || []).filter(
      (future: ActiveFutures) => {
        const matchesSearch =
          activeFuturesSearchTerm === "" ||
          future.title
            .toLowerCase()
            .includes(activeFuturesSearchTerm.toLowerCase()) ||
          future.content
            .toLowerCase()
            .includes(activeFuturesSearchTerm.toLowerCase()) ||
          future.trader
            .toLowerCase()
            .includes(activeFuturesSearchTerm.toLowerCase());

        const matchesTrader =
          selectedActiveFuturesTrader === "all" ||
          future.trader === selectedActiveFuturesTrader;

        const matchesStatus =
          selectedActiveFuturesStatus === "all" ||
          future.status === selectedActiveFuturesStatus;

        // Date range filtering
        const futureDate = new Date(future.created_at);
        const activeFuturesDateRangeFilter = getDateRange(
          activeFuturesDateRange
        );
        const matchesDateRange =
          !activeFuturesDateRangeFilter ||
          (futureDate >= activeFuturesDateRangeFilter.from &&
            futureDate <= activeFuturesDateRangeFilter.to);

        return (
          matchesSearch && matchesTrader && matchesStatus && matchesDateRange
        );
      }
    );

    const sorted = filtered.sort((a: ActiveFutures, b: ActiveFutures) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return activeFuturesSortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    // Apply result limit
    return sorted.slice(0, activeFuturesResultLimit);
  }, [
    activeFuturesData,
    activeFuturesSearchTerm,
    selectedActiveFuturesTrader,
    selectedActiveFuturesStatus,
    activeFuturesSortBy,
    activeFuturesResultLimit,
    activeFuturesDateRange,
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
    <div className="min-h-screen px-2 pt-24 bg-gradient-to-br from-black via-purple-950/20 to-black relative overflow-hidden">
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
        {/* Dynamic Platform Cards */}
        <div className="mb-6">
          <DynamicPlatformCards />
        </div>

        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 border-gray-700">
            <TabsTrigger
              value="trades"
              className="data-[state=active]:bg-gray-800"
            >
              Trades
            </TabsTrigger>
            <TabsTrigger
              value="active-futures"
              className="data-[state=active]:bg-gray-800"
            >
              Active Futures
            </TabsTrigger>
            <TabsTrigger
              value="trading-log"
              className="data-[state=active]:bg-gray-800"
            >
              Trading Log
            </TabsTrigger>

            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-gray-800"
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trading-log" className="mt-6">
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Alert</span>
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
                    {tradeTypes.map((type, index: number) => (
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
                    {coins.map((coin, index: number) => (
                      <SelectItem key={`coin-${coin}-${index}`} value={coin}>
                        {coin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedTraderLog}
                  onValueChange={setSelectedTraderLog}
                >
                  <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Trader" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Traders</SelectItem>
                    {traders.map((trader, index: number) => (
                      <SelectItem
                        key={`traderlog-${trader}-${index}`}
                        value={trader}
                      >
                        {trader}
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
                        <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                          Trader
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
                      {filteredEntries.map(
                        (entry: TradeEntry, index: number) => {
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
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="border-orange-500/50 text-orange-300 bg-orange-900/50"
                                >
                                  {entry.trade?.trader ||
                                    entry.alert?.trader ||
                                    "N/A"}
                                </Badge>
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
                        }
                      )}
                      {filteredEntries.length === 0 && (
                        <TableRow key="empty-entries">
                          <TableCell colSpan={8} className="text-center py-8">
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <Card className="bg-red-950/20 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-red-200 mb-2">
                    Error Loading Trades
                  </h2>
                  <p className="text-red-300">
                    {error ? String(error) : "Unknown error occurred"}
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
                        {traders.map((trader, index: number) => (
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
                        {signalTypes.map((type, index: number) => (
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
                        {statuses.map((status, index: number) => (
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
                      value={selectedCoinTrades}
                      onValueChange={setSelectedCoinTrades}
                    >
                      <SelectTrigger className="w-[120px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Coin" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Coins</SelectItem>
                        {coins.map((coin, index: number) => (
                          <SelectItem
                            key={`cointrades-${coin}-${index}`}
                            value={coin}
                          >
                            {coin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedExchange}
                      onValueChange={setSelectedExchange}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Exchange" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Exchanges</SelectItem>
                        {exchanges.map((exchange, index: number) => (
                          <SelectItem
                            key={`exchange-${exchange}-${index}`}
                            value={exchange}
                          >
                            {exchange}
                          </SelectItem>
                        ))}
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
                            <TableHead className="text-gray-300 w-[40px] font-semibold"></TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[110px]">
                              Date/Time (UAE)
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Trader
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[220px]">
                              Content
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[60px]">
                              Coin
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Signal Type
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Position
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Order
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Pos.Size
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Entry Price
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Exit Price
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              P&L (USD)
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Exchange
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[80px]">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrades.map(
                            (trade: TradesRow, index: number) => (
                              <React.Fragment
                                key={`trade-${trade.id}-${index}`}
                              >
                                <TableRow
                                  className={`border-gray-700 hover:bg-gray-800/30 transition-colors ${
                                    selectedTrade?.id === trade.id &&
                                    showBinanceModal
                                      ? "bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/20"
                                      : highlightedTradeId === trade.id
                                      ? "bg-blue-500/20 border-blue-500/20"
                                      : ""
                                  }`}
                                >
                                  <TableCell>
                                    <button
                                      onClick={() =>
                                        toggleRowExpansion(trade.id)
                                      }
                                      className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                                      disabled={
                                        !alertsData.some(
                                          (alert: Alert) =>
                                            alert.trade === trade.discord_id ||
                                            alert.parsed_alert
                                              ?.original_trade_id === trade.id
                                        )
                                      }
                                    >
                                      {alertsData.some(
                                        (alert: Alert) =>
                                          alert.trade === trade.discord_id ||
                                          alert.parsed_alert
                                            ?.original_trade_id === trade.id
                                      ) ? (
                                        expandedRows.has(trade.id) ? (
                                          <ChevronDown className="w-4 h-4 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )
                                      ) : (
                                        <div className="w-4 h-4" />
                                      )}
                                    </button>
                                  </TableCell>
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
                                      className="border-green-500/50 text-green-300 bg-green-900/50"
                                    >
                                      {trade.coin_symbol}
                                    </Badge>
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
                                          case "CANCELLED":
                                            return "border-red-500/50 text-red-300";

                                          default:
                                            return "border-gray-500/50 text-gray-400";
                                        }
                                      })()}
                                    >
                                      {trade.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={(() => {
                                        const status = trade.order_status
                                          ?.toString()
                                          .trim()
                                          .toUpperCase();
                                        switch (status) {
                                          case "FILLED":
                                            return "border-green-500/50 text-green-300";
                                          case "PENDING":
                                            return "border-yellow-500/50 text-yellow-300";
                                          case "UNFILLED":
                                            return "border-cyan-500/50 text-cyan-300";
                                          case "CANCELLED":
                                            return "border-red-500/50 text-red-300";
                                          case "PARTIALLY_FILLED":
                                            return "border-blue-500/50 text-blue-300";

                                          default:
                                            return "border-gray-500/50 text-gray-400";
                                        }
                                      })()}
                                    >
                                      {trade.order_status}
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

                                  <TableCell className="text-blue-200 font-medium">
                                    {trade.binance_entry_price
                                      ? `$${trade.binance_entry_price.toFixed(
                                          2
                                        )}`
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-purple-200 font-medium">
                                    {trade.binance_exit_price
                                      ? `$${trade.binance_exit_price.toFixed(
                                          2
                                        )}`
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
                                    {trade.pnl_usd
                                      ? `$${trade.pnl_usd.toFixed(2)}`
                                      : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={`border-gray-500/50 text-gray-300 bg-gray-900/50 ${
                                        trade.exchange &&
                                        trade.exchange.toLowerCase() ===
                                          "binance"
                                          ? "border-yellow-500/50 text-yellow-300 bg-yellow-900/50"
                                          : "border-green-500/50 text-green-300 bg-green-900/50"
                                      }`}
                                    >
                                      {trade.exchange || "-"}
                                    </Badge>
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
                                        const viewportHeight =
                                          window.innerHeight;

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
                                          if (
                                            x + modalWidth >
                                            tableRect.right
                                          ) {
                                            x =
                                              tableRect.right - modalWidth - 10;
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

                                {/* Expanded Alerts Row */}
                                {expandedRows.has(trade.id) && (
                                  <TableRow
                                    key={`expanded-${trade.id}`}
                                    className="border-gray-700 bg-gray-800/20"
                                  >
                                    <TableCell colSpan={13} className="p-0">
                                      <div className="p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-l-4 border-blue-500/50">
                                        <div className="mb-2">
                                          <h4 className="text-blue-300 font-semibold text-sm">
                                            Related Alerts (
                                            {
                                              alertsData.filter(
                                                (alert: Alert) =>
                                                  alert.trade ===
                                                    trade.discord_id ||
                                                  alert.parsed_alert
                                                    ?.original_trade_id ===
                                                    trade.id
                                              ).length
                                            }
                                            )
                                          </h4>
                                        </div>
                                        <div className="space-y-2">
                                          {alertsData
                                            .filter(
                                              (alert: Alert) =>
                                                alert.trade ===
                                                  trade.discord_id ||
                                                alert.parsed_alert
                                                  ?.original_trade_id ===
                                                  trade.id
                                            )
                                            .sort(
                                              (a: Alert, b: Alert) =>
                                                new Date(
                                                  a.timestamp
                                                ).getTime() -
                                                new Date(b.timestamp).getTime()
                                            )
                                            .map(
                                              (
                                                alert: Alert,
                                                alertIndex: number
                                              ) => (
                                                <div
                                                  key={`alert-${alert.discord_id}-${alertIndex}`}
                                                  className="bg-gray-800/50 rounded p-2 border border-gray-700/50"
                                                >
                                                  <div className="grid grid-cols-6 gap-4 items-center text-sm">
                                                    <div className="text-gray-400 font-mono min-w-[100px]">
                                                      <div className="flex flex-col">
                                                        <span className="font-medium">
                                                          {formatInTimeZone(
                                                            new Date(
                                                              alert.timestamp
                                                            ),
                                                            "Asia/Dubai",
                                                            "MMM dd, yyyy"
                                                          )}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                          {formatInTimeZone(
                                                            new Date(
                                                              alert.timestamp
                                                            ),
                                                            "Asia/Dubai",
                                                            "HH:mm"
                                                          )}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="text-gray-200 col-span-2">
                                                      {alert.content}
                                                    </div>
                                                    <div className="flex items-center gap-2 min-w-[100px]">
                                                      <Badge
                                                        variant="outline"
                                                        className="border-green-500/50 text-green-300 bg-green-900/20 text-xs"
                                                      >
                                                        Status:{" "}
                                                        {alert.status || " _ "}
                                                      </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                      <Badge
                                                        variant="outline"
                                                        className="border-blue-500/50 text-blue-300 bg-blue-900/20 text-xs"
                                                      >
                                                        {getStateFromSignal(
                                                          trade as unknown as Trade,
                                                          alert
                                                        )}
                                                      </Badge>
                                                    </div>
                                                    <div className="flex flex-col gap-1 min-w-[150px]">
                                                      <div className="text-blue-300 text-xs font-medium">
                                                        {alert.parsed_alert
                                                          ?.action_determined
                                                          ?.action_description ||
                                                          "N/A"}
                                                      </div>
                                                      <div className="text-gray-400 text-xs">
                                                        {alert.parsed_alert
                                                          ?.action_determined
                                                          ?.reason || "_"}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          {alertsData.filter(
                                            (alert: Alert) =>
                                              alert.trade ===
                                                trade.discord_id ||
                                              alert.parsed_alert
                                                ?.original_trade_id === trade.id
                                          ).length === 0 && (
                                            <div className="text-center py-2 text-gray-500 text-sm">
                                              No alerts found for this trade
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            )
                          )}

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

          <TabsContent value="active-futures" className="mt-6">
            {activeFuturesLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : activeFuturesError ? (
              <Card className="bg-red-950/20 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-red-200 mb-2">
                    Error Loading Active Futures
                  </h2>
                  <p className="text-red-300">
                    {activeFuturesError
                      ? String(activeFuturesError)
                      : "Unknown error occurred"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Futures Search and Filter Controls */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[250px] relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search futures, content, or trader..."
                        value={activeFuturesSearchTerm}
                        onChange={(e) =>
                          setActiveFuturesSearchTerm(e.target.value)
                        }
                        className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                      />
                    </div>

                    <Select
                      value={selectedActiveFuturesTrader}
                      onValueChange={setSelectedActiveFuturesTrader}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Trader" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Traders</SelectItem>
                        {activeFuturesTraders.map((trader, index: number) => (
                          <SelectItem
                            key={`activefutures-trader-${trader}-${index}`}
                            value={trader}
                          >
                            {trader}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedActiveFuturesStatus}
                      onValueChange={setSelectedActiveFuturesStatus}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        {activeFuturesStatuses.map((status, index: number) => (
                          <SelectItem
                            key={`activefutures-status-${status}-${index}`}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={activeFuturesDateRange}
                      onValueChange={setActiveFuturesDateRange}
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
                      value={activeFuturesSortBy}
                      onValueChange={(value) =>
                        setActiveFuturesSortBy(value as "newest" | "oldest")
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
                      value={activeFuturesResultLimit.toString()}
                      onValueChange={(value) =>
                        setActiveFuturesResultLimit(parseInt(value))
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
                        Active Futures ({filteredActiveFutures.length} of{" "}
                        {activeFuturesData?.length || 0} entries)
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700 hover:bg-gray-800/50 bg-gray-800/30">
                            <TableHead className="text-gray-300 font-semibold min-w-[150px]">
                              Date/Time (UAE)
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[90px]">
                              Trader
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[200px]">
                              Title
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[300px]">
                              Content
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Status
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[150px]">
                              Stopped At
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredActiveFutures.map(
                            (future: ActiveFutures, index: number) => (
                              <TableRow
                                key={`active-future-${future.id}-${index}`}
                                className="border-gray-700 hover:bg-gray-800/30 transition-colors"
                              >
                                <TableCell className="font-mono text-sm text-gray-300">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {formatInTimeZone(
                                        new Date(future.created_at),
                                        "Asia/Dubai",
                                        "MMM dd, yyyy"
                                      )}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatInTimeZone(
                                        new Date(future.created_at),
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
                                    {future.trader}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <div
                                    className="text-gray-200 text-sm leading-relaxed truncate"
                                    title={future.title}
                                  >
                                    {future.title}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                  <div
                                    className="text-gray-300 text-sm leading-relaxed"
                                    title={future.content}
                                  >
                                    {future.content}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={(() => {
                                      const status = future.status
                                        ?.toString()
                                        .trim()
                                        .toUpperCase();
                                      switch (status) {
                                        case "ACTIVE":
                                          return "border-green-500/50 text-green-300 bg-green-900/20";
                                        case "STOPPED":
                                          return "border-red-500/50 text-red-300 bg-red-900/20";
                                        case "PENDING":
                                          return "border-yellow-500/50 text-yellow-300 bg-yellow-900/20";
                                        default:
                                          return "border-gray-500/50 text-gray-400 bg-gray-900/20";
                                      }
                                    })()}
                                  >
                                    {future.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-400">
                                  {future.stopped_at ? (
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {formatInTimeZone(
                                          new Date(future.stopped_at),
                                          "Asia/Dubai",
                                          "MMM dd, yyyy"
                                        )}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatInTimeZone(
                                          new Date(future.stopped_at),
                                          "Asia/Dubai",
                                          "HH:mm"
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          )}

                          {filteredActiveFutures.length === 0 && (
                            <TableRow key="empty-active-futures">
                              <TableCell
                                colSpan={6}
                                className="text-center py-8"
                              >
                                <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">
                                  {activeFuturesSearchTerm ||
                                  selectedActiveFuturesTrader !== "all" ||
                                  selectedActiveFuturesStatus !== "all" ||
                                  activeFuturesDateRange !== "all"
                                    ? "No active futures match your filters"
                                    : "No active futures available"}
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

          <TabsContent value="transactions" className="mt-6">
            {transactionLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : transactionError ? (
              <Card className="bg-red-950/20 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-red-200 mb-2">
                    Error Loading Transactions
                  </h2>
                  <p className="text-red-300">
                    {transactionError
                      ? String(transactionError)
                      : "Unknown error occurred"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Transaction Search and Filter Controls */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[250px] relative">
                      <Input
                        placeholder="Search transactions..."
                        value={transactionsSearchTerm}
                        onChange={(e) =>
                          setTransactionsSearchTerm(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setSubmittedSearchTerm(transactionsSearchTerm);
                          }
                        }}
                        className="pl-3 pr-10 bg-gray-900/50 border-gray-700 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (transactionsSearchTerm || submittedSearchTerm) {
                            handleClearSearch();
                          } else {
                            setSubmittedSearchTerm(transactionsSearchTerm);
                          }
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {transactionsSearchTerm || submittedSearchTerm ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <Select
                      value={selectedTransactionType}
                      onValueChange={setSelectedTransactionType}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Types</SelectItem>
                        {transactionTypes.map((type, index: number) => (
                          <SelectItem
                            key={`transactiontype-${type}-${index}`}
                            value={type}
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTransactionAsset}
                      onValueChange={setSelectedTransactionAsset}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Asset" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Assets</SelectItem>
                        {transactionAssets.map((asset, index: number) => (
                          <SelectItem
                            key={`transactionasset-${asset}-${index}`}
                            value={asset}
                          >
                            {asset}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTransactionSymbol}
                      onValueChange={setSelectedTransactionSymbol}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Symbol" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Symbols</SelectItem>
                        {transactionSymbols.map((symbol, index: number) => (
                          <SelectItem
                            key={`transactionsymbol-${symbol}-${index}`}
                            value={symbol}
                          >
                            {symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTransactionExchange}
                      onValueChange={setSelectedTransactionExchange}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Exchange" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="all">All Exchanges</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="kucoin">KuCoin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={transactionsDateRange}
                      onValueChange={setTransactionsDateRange}
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
                      value={transactionsSortBy}
                      onValueChange={(value) =>
                        setTransactionsSortBy(value as "newest" | "oldest")
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
                      value={transactionsResultLimit.toString()}
                      onValueChange={(value) =>
                        setTransactionsResultLimit(parseInt(value))
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
                        Transaction History (
                        {transactionData?.transactions?.length || 0} of{" "}
                        {transactionData?.total || 0} entries)
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700 hover:bg-gray-800/50 bg-gray-800/30">
                            <TableHead className="text-gray-300 font-semibold min-w-[150px]">
                              Date/Time (UTC)
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Type
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[120px]">
                              Amount
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Asset
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Symbol
                            </TableHead>
                            <TableHead className="text-gray-300 font-semibold min-w-[100px]">
                              Exchange
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactionData?.transactions?.map(
                            (transaction: Transaction, index: number) => (
                              <TableRow
                                key={`transaction-${index}`}
                                className="border-gray-700 hover:bg-gray-800/30 transition-colors"
                              >
                                <TableCell className="font-mono text-sm text-gray-300">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {formatInTimeZone(
                                        new Date(transaction.time),
                                        "UTC",
                                        "MMM dd, yyyy"
                                      )}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatInTimeZone(
                                        new Date(transaction.time),
                                        "UTC",
                                        "HH:mm:ss"
                                      )}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      transaction.type === "BUY"
                                        ? "border-green-500/50 text-green-300 bg-green-900/20"
                                        : transaction.type === "SELL"
                                        ? "border-red-500/50 text-red-300 bg-red-900/20"
                                        : "border-blue-500/50 text-blue-300 bg-blue-900/20"
                                    }
                                  >
                                    {transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`font-medium ${
                                      transaction.amount > 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {transaction.amount.toFixed(6)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="border-purple-500/50 text-purple-300 bg-purple-900/20"
                                  >
                                    {transaction.asset}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="border-cyan-500/50 text-cyan-300 bg-cyan-900/20"
                                  >
                                    {transaction.symbol}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      transaction.exchange === "binance"
                                        ? "border-yellow-500/50 text-yellow-300 bg-yellow-900/20"
                                        : transaction.exchange === "kucoin"
                                        ? "border-blue-500/50 text-blue-300 bg-blue-900/20"
                                        : "border-gray-500/50 text-gray-300 bg-gray-900/20"
                                    }
                                  >
                                    {transaction.exchange?.toUpperCase() ||
                                      "N/A"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          )}

                          {(!transactionData?.transactions ||
                            transactionData.transactions.length === 0) && (
                            <TableRow key="empty-transactions">
                              <TableCell
                                colSpan={5}
                                className="text-center py-8"
                              >
                                <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">
                                  {transactionsSearchTerm ||
                                  selectedTransactionType !== "all" ||
                                  selectedTransactionAsset !== "all" ||
                                  selectedTransactionSymbol !== "all" ||
                                  transactionsDateRange !== "all"
                                    ? "No transactions match your filters"
                                    : "No transactions available"}
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
        <ExchangeResponseModal
          trade={{
            ...selectedTrade,
            exchange_response: selectedTrade.binance_response,
          }}
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
