"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  AlertTriangle,
  TrendingUp,
  User,
  Clock,
  MessageSquare,
  Search,
  Filter,
  Grid,
  List,
  Eye,
} from "lucide-react";
import { Alert, Trade } from "@/types/wealthgroup";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

async function fetchWealthgroupData() {
  const response = await fetch("/api/wealthgroup");
  if (!response.ok) {
    throw new Error("Failed to fetch wealthgroup data");
  }
  return response.json();
}

export default function WealthgroupPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrader, setSelectedTrader] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [traderModalOpen, setTraderModalOpen] = useState(false);
  const [selectedTraderForModal, setSelectedTraderForModal] =
    useState<string>("");
  const [tradeAlertsModalOpen, setTradeAlertsModalOpen] = useState(false);
  const [selectedTradeForModal, setSelectedTradeForModal] =
    useState<Trade | null>(null);
  const [alertTradeModalOpen, setAlertTradeModalOpen] = useState(false);
  const [selectedAlertForModal, setSelectedAlertForModal] =
    useState<Alert | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["wealthgroup"],
    queryFn: fetchWealthgroupData,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { alerts = [], trades = [] } = data || {};

  // Get unique traders for filter
  const traders = useMemo(() => {
    const uniqueTraders = new Set([
      ...trades.map((t: Trade) => t.trader),
      ...alerts.map((a: Alert) => a.trader),
    ]);
    return Array.from(uniqueTraders).sort();
  }, [trades, alerts]);

  // Filter trades based on search and trader
  const filteredTrades = useMemo(() => {
    return trades.filter((trade: Trade) => {
      const matchesSearch =
        searchTerm === "" ||
        trade.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.trader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.structured.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTrader =
        selectedTrader === "all" || trade.trader === selectedTrader;

      return matchesSearch && matchesTrader;
    });
  }, [trades, searchTerm, selectedTrader]);

  // Filter alerts based on search and trader
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert: Alert) => {
      const matchesSearch =
        searchTerm === "" ||
        alert.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.trader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.trade.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTrader =
        selectedTrader === "all" || alert.trader === selectedTrader;

      return matchesSearch && matchesTrader;
    });
  }, [alerts, searchTerm, selectedTrader]);

  // Get alerts for a specific trade
  const getAlertsForTrade = (tradeDiscordId: string) => {
    return alerts.filter((alert: Alert) => alert.trade === tradeDiscordId);
  };

  // Get all alerts for a specific trader
  const getAlertsForTrader = (trader: string) => {
    return alerts.filter((alert: Alert) => alert.trader === trader);
  };

  // Open trader modal
  const openTraderModal = (trader: string) => {
    setSelectedTraderForModal(trader);
    setTraderModalOpen(true);
  };

  // Open trade alerts modal
  const openTradeAlertsModal = (trade: Trade) => {
    setSelectedTradeForModal(trade);
    setTradeAlertsModalOpen(true);
  };

  // Open alert trade modal
  const openAlertTradeModal = (alert: Alert) => {
    setSelectedAlertForModal(alert);
    setAlertTradeModalOpen(true);
  };

  // Get trade by discord_id
  const getTradeByDiscordId = (discordId: string) => {
    return trades.find((trade: Trade) => trade.discord_id === discordId);
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
    <div className="min-h-screen pt-24 bg-gradient-to-br from-black via-purple-950/20 to-black relative overflow-hidden">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Wealth Group Trading
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time trading signals and alerts from the wealth group community
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search trades, traders, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white"
              />
            </div>
            <Select value={selectedTrader} onValueChange={setSelectedTrader}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-900/50 border-gray-700 text-white">
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
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trades" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-gray-900/50 border border-gray-700">
            <TabsTrigger
              value="trades"
              className="data-[state=active]:bg-blue-600"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trades ({filteredTrades.length})
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="data-[state=active]:bg-purple-600"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts ({filteredAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
                  : "space-y-3"
              }
            >
              {filteredAlerts.map((alert: Alert) => (
                <Card
                  key={alert.discord_id}
                  className="bg-gray-900/50 border-gray-700 hover:border-purple-500/30 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="border-purple-500/50 text-purple-300 cursor-pointer hover:bg-purple-500/10"
                          onClick={() => openTraderModal(alert.trader)}
                        >
                          <User className="w-3 h-3 mr-1" />
                          {alert.trader}
                        </Badge>
                        <div className="flex items-center text-gray-400 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(alert.timestamp), "MMM dd, HH:mm")}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="border-gray-500/50 text-gray-300 text-xs"
                        >
                          {alert.trade}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAlertTradeModal(alert)}
                          className="px-2 py-1 h-6 hover:bg-purple-500/20 text-xs"
                          title="View related trade"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trade
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p
                      className="text-gray-200 text-sm leading-relaxed overflow-hidden text-ellipsis"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {alert.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {filteredAlerts.length === 0 && (
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {searchTerm || selectedTrader !== "all"
                        ? "No alerts match your filters"
                        : "No alerts available"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {filteredTrades.map((trade: Trade) => {
                const tradeAlerts = getAlertsForTrade(trade.discord_id);
                return (
                  <Card
                    key={trade.id}
                    className="bg-gray-900/50 border-gray-700 hover:border-blue-500/30 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="border-blue-500/50 text-blue-300 cursor-pointer hover:bg-blue-500/10"
                            onClick={() => openTraderModal(trade.trader)}
                          >
                            <User className="w-3 h-3 mr-1" />
                            {trade.trader}
                          </Badge>
                          <div className="flex items-center text-gray-400 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(new Date(trade.timestamp), "MMM dd, HH:mm")}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="border-gray-500/50 text-gray-300 text-xs"
                            >
                              ID: {trade.id}
                            </Badge>
                            {tradeAlerts.length > 0 && (
                              <Badge
                                variant="outline"
                                className="border-orange-500/50 text-orange-300 text-xs"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {tradeAlerts.length}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTradeAlertsModal(trade)}
                              className="px-2 py-1 h-6 hover:bg-blue-500/20 text-xs"
                              title="View all alerts for this trade"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Alerts
                            </Button>
                            {tradeAlerts.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedTrade(
                                    selectedTrade === trade.discord_id
                                      ? null
                                      : trade.discord_id
                                  )
                                }
                                className="p-1 h-5 w-5"
                                title="Toggle alerts preview"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <p
                        className="text-gray-200 text-sm leading-relaxed overflow-hidden text-ellipsis"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {trade.content}
                      </p>
                      {trade.structured && (
                        <code className="text-green-300 bg-gray-800/50 px-2 py-1 rounded block font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                          {trade.structured}
                        </code>
                      )}

                      {/* Show alerts for this trade if selected */}
                      {selectedTrade === trade.discord_id &&
                        tradeAlerts.length > 0 && (
                          <div className="mt-3 border-t border-gray-700 pt-2">
                            <h4 className="text-xs font-medium text-orange-400 mb-2">
                              Related Alerts:
                            </h4>
                            <div className="space-y-1">
                              {tradeAlerts.map((alert: Alert) => (
                                <div
                                  key={alert.discord_id}
                                  className="bg-gray-800/30 p-2 rounded border-l-2 border-orange-500/50"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge
                                      variant="outline"
                                      className="border-orange-500/50 text-orange-300 text-xs cursor-pointer hover:bg-orange-500/10"
                                      onClick={() =>
                                        openTraderModal(alert.trader)
                                      }
                                    >
                                      {alert.trader}
                                    </Badge>
                                    <span className="text-xs text-gray-400">
                                      {format(
                                        new Date(alert.timestamp),
                                        "MMM dd, HH:mm"
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-300">
                                    {alert.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
              {filteredTrades.length === 0 && (
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {searchTerm || selectedTrader !== "all"
                        ? "No trades match your filters"
                        : "No trades available"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Trader Alerts Modal */}
        <Dialog open={traderModalOpen} onOpenChange={setTraderModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedTraderForModal} - All Alerts
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {getAlertsForTrader(selectedTraderForModal).map(
                (alert: Alert) => (
                  <div
                    key={alert.discord_id}
                    className="bg-gray-800/50 p-3 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="outline"
                        className="border-gray-500/50 text-gray-300 text-xs"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Trade: {alert.trade}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {format(
                          new Date(alert.timestamp),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {alert.content}
                    </p>
                  </div>
                )
              )}
              {getAlertsForTrader(selectedTraderForModal).length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    No alerts found for this trader
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Trade Alerts Modal */}
        <Dialog
          open={tradeAlertsModalOpen}
          onOpenChange={setTradeAlertsModalOpen}
        >
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trade ID {selectedTradeForModal?.id} - All Alerts
              </DialogTitle>
            </DialogHeader>
            {selectedTradeForModal && (
              <div className="space-y-4 mt-4">
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Trade Details:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-blue-500/50 text-blue-300"
                      >
                        {selectedTradeForModal.trader}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {format(
                          new Date(selectedTradeForModal.timestamp),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">
                      {selectedTradeForModal.content}
                    </p>
                    {selectedTradeForModal.structured && (
                      <code className="text-green-300 bg-gray-800/50 px-2 py-1 rounded block font-mono text-xs">
                        {selectedTradeForModal.structured}
                      </code>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-orange-400">
                    Related Alerts:
                  </h3>
                  {getAlertsForTrade(selectedTradeForModal.discord_id).map(
                    (alert: Alert) => (
                      <div
                        key={alert.discord_id}
                        className="bg-gray-800/50 p-3 rounded border border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="outline"
                            className="border-orange-500/50 text-orange-300"
                          >
                            {alert.trader}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {format(
                              new Date(alert.timestamp),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </span>
                        </div>
                        <p className="text-gray-200 text-sm">{alert.content}</p>
                      </div>
                    )
                  )}
                  {getAlertsForTrade(selectedTradeForModal.discord_id)
                    .length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">
                        No alerts found for this trade
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Alert Trade Modal */}
        <Dialog
          open={alertTradeModalOpen}
          onOpenChange={setAlertTradeModalOpen}
        >
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alert Details & Related Trade
              </DialogTitle>
            </DialogHeader>
            {selectedAlertForModal && (
              <div className="space-y-4 mt-4">
                <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Alert Details:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-purple-500/50 text-purple-300"
                      >
                        {selectedAlertForModal.trader}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {format(
                          new Date(selectedAlertForModal.timestamp),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">
                      {selectedAlertForModal.content}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-blue-400">
                    Related Trade:
                  </h3>
                  {(() => {
                    const relatedTrade = getTradeByDiscordId(
                      selectedAlertForModal.trade
                    );
                    return relatedTrade ? (
                      <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-blue-500/50 text-blue-300"
                            >
                              {relatedTrade.trader}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-gray-500/50 text-gray-300 text-xs"
                            >
                              ID: {relatedTrade.id}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {format(
                                new Date(relatedTrade.timestamp),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </span>
                          </div>
                          <p className="text-gray-200 text-sm">
                            {relatedTrade.content}
                          </p>
                          {relatedTrade.structured && (
                            <code className="text-green-300 bg-gray-800/50 px-2 py-1 rounded block font-mono text-xs">
                              {relatedTrade.structured}
                            </code>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">Related trade not found</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
