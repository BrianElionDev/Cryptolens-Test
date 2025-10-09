"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Save,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTradingSettings } from "@/hooks/useTradingSettings";
import { ExchangeSettings } from "@/stores/tradingSettingsStore";

// Exchange display information
const exchangeInfo = {
  binance: {
    name: "Binance",
    description: "World's largest cryptocurrency exchange",
    color: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/30",
    icon: "🟡",
  },
  kucoin: {
    name: "KuCoin",
    description: "Global cryptocurrency exchange",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    icon: "🔵",
  },
};

export default function TradingSettingsPage() {
  const {
    settings,
    updateExchangeSetting,
    updateSettings,
    resetSettings: resetStoreSettings,
    getTotalPositionSize,
    getAverageLeverage,
  } = useTradingSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingExchange, setIsAddingExchange] = useState(false);
  const [newExchange, setNewExchange] = useState({
    exchange: "",
    traderId: "",
    leverage: 1,
    positionSize: 100,
  });
  const { toast } = useToast();

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/trading-settings");
        const data = await response.json();
        if (data.settings) {
          updateSettings(data.settings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, [updateSettings]);

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save to API
      const response = await fetch("/api/trading-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setHasChanges(false);

      toast({
        title: "Settings Saved",
        description: "Your trading settings have been updated successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    resetStoreSettings();
    setHasChanges(true);
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };

  const addExchange = async () => {
    setIsAddingExchange(true);
    try {
      const response = await fetch("/api/trading-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add_exchange",
          ...newExchange,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add exchange");
      }

      // Refresh settings from API
      const settingsResponse = await fetch("/api/trading-settings");
      const settingsData = await settingsResponse.json();
      updateSettings(settingsData.settings);

      setNewExchange({
        exchange: "",
        traderId: "",
        leverage: 1,
        positionSize: 100,
      });

      toast({
        title: "Exchange Added",
        description: `${newExchange.exchange} has been added successfully.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add exchange. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingExchange(false);
    }
  };

  const handleUpdateSetting = (
    exchange: string,
    field: keyof ExchangeSettings,
    value: number | boolean
  ) => {
    updateExchangeSetting(exchange, field, value);
    setHasChanges(true);
  };

  const ExchangeSettingsCard = ({ exchange }: { exchange: string }) => {
    const exchangeData = exchangeInfo[
      exchange as keyof typeof exchangeInfo
    ] || {
      name: exchange.charAt(0).toUpperCase() + exchange.slice(1),
      description: "Cryptocurrency exchange",
      color: "from-gray-500/20 to-gray-600/20",
      borderColor: "border-gray-500/30",
      icon: "⚪",
    };
    const exchangeSettings = settings[exchange];
    const [positionSizeInput, setPositionSizeInput] = useState<string>(
      exchangeSettings?.positionSize?.toString() || "100"
    );

    useEffect(() => {
      setPositionSizeInput(exchangeSettings?.positionSize?.toString() || "100");
    }, [exchangeSettings?.positionSize]);

    return (
      <Card className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 border border-gray-700/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:border-gray-600/60">
        <CardHeader className="border-b border-gray-700/40 py-2 px-3 bg-gradient-to-r from-gray-800/20 to-gray-700/10">
          <CardTitle className="text-white flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <span className="text-lg">{exchangeData.icon}</span>
              </div>
              <div>
                <span className="font-semibold text-white">
                  {exchangeData.name.toUpperCase()}
                </span>
                <p className="text-gray-400 text-xs">
                  {exchangeData.description}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-3 space-y-4">
          {/* Trader ID */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-500/30 text-blue-300 bg-blue-500/10 backdrop-blur-sm"
            >
              {exchangeSettings?.traderId || "N/A"}
            </Badge>
          </div>

          {/* Position Size */}
          <div className="space-y-2">
            <Label
              htmlFor={`${exchange}-positionSize`}
              className="text-gray-300 text-sm font-medium"
            >
              Position Size (USDT)
            </Label>
            <Input
              id={`${exchange}-positionSize`}
              type="text"
              value={positionSizeInput}
              onChange={(e) => {
                const next = e.target.value;
                // Allow only digits and a single dot
                if (/^\d*(\.\d*)?$/.test(next)) {
                  setPositionSizeInput(next);
                }
              }}
              onBlur={() => {
                const parsed = parseFloat(positionSizeInput);
                handleUpdateSetting(
                  exchange,
                  "positionSize",
                  Number.isNaN(parsed) ? 0 : parsed
                );
              }}
              className="bg-gray-800/50 border-gray-600/40 text-white hover:border-gray-500/60 focus:border-blue-500/60 transition-all duration-200 backdrop-blur-sm"
              placeholder="100"
              inputMode="decimal"
            />
          </div>

          {/* Leverage */}
          <div className="space-y-2">
            <Label
              htmlFor={`${exchange}-leverage`}
              className="text-gray-300 text-sm font-medium"
            >
              Leverage
            </Label>
            <Select
              value={exchangeSettings?.leverage?.toString() || "1"}
              onValueChange={(value) =>
                handleUpdateSetting(exchange, "leverage", parseFloat(value))
              }
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600/40 text-white hover:border-gray-500/60 focus:border-blue-500/60 transition-all duration-200 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800/95 border-gray-700/50 backdrop-blur-sm">
                {[1, 2, 3, 4, 5, 10, 20, 25, 50, 75, 100, 125].map(
                  (leverage) => (
                    <SelectItem
                      key={leverage}
                      value={leverage.toString()}
                      className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50"
                    >
                      {leverage}x
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Trading Settings
              </h1>
              <p className="text-gray-400">
                Configure position sizes and leverage for each exchange
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              onClick={saveSettings}
              disabled={!hasChanges || isLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-blue-600/40 text-blue-300 hover:bg-blue-700/40 hover:border-blue-500/60 transition-all duration-200 backdrop-blur-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exchange
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900/95 border-gray-700/50 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Add New Exchange
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="exchange-name" className="text-gray-300">
                      Exchange Name
                    </Label>
                    <Input
                      id="exchange-name"
                      value={newExchange.exchange}
                      onChange={(e) =>
                        setNewExchange({
                          ...newExchange,
                          exchange: e.target.value,
                        })
                      }
                      className="bg-gray-800/50 border-gray-600/40 text-white"
                      placeholder="e.g., bybit, okx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trader-id" className="text-gray-300">
                      Trader ID
                    </Label>
                    <Input
                      id="trader-id"
                      value={newExchange.traderId}
                      onChange={(e) =>
                        setNewExchange({
                          ...newExchange,
                          traderId: e.target.value,
                        })
                      }
                      className="bg-gray-800/50 border-gray-600/40 text-white"
                      placeholder="e.g., johnny, tareeq"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-leverage" className="text-gray-300">
                      Leverage
                    </Label>
                    <Select
                      value={newExchange.leverage.toString()}
                      onValueChange={(value) =>
                        setNewExchange({
                          ...newExchange,
                          leverage: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-600/40 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800/95 border-gray-700/50">
                        {[1, 2, 3, 4, 5, 10, 20, 25, 50, 75, 100, 125].map(
                          (leverage) => (
                            <SelectItem
                              key={leverage}
                              value={leverage.toString()}
                              className="text-white hover:bg-gray-700/50"
                            >
                              {leverage}x
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="new-position-size"
                      className="text-gray-300"
                    >
                      Position Size (USDT)
                    </Label>
                    <Input
                      id="new-position-size"
                      type="number"
                      value={newExchange.positionSize}
                      onChange={(e) =>
                        setNewExchange({
                          ...newExchange,
                          positionSize: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="bg-gray-800/50 border-gray-600/40 text-white"
                      placeholder="100"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button
                    onClick={addExchange}
                    disabled={
                      !newExchange.exchange ||
                      !newExchange.traderId ||
                      isAddingExchange
                    }
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    {isAddingExchange ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Exchange
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={resetSettings}
              variant="outline"
              className="border-gray-600/40 text-gray-300 hover:bg-gray-700/40 hover:border-gray-500/60 transition-all duration-200 backdrop-blur-sm"
            >
              Reset to Default
            </Button>

            {hasChanges && (
              <Badge
                variant="outline"
                className="border-yellow-500/30 text-yellow-300 bg-yellow-500/10 backdrop-blur-sm"
              >
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>

        {/* Exchange Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.keys(settings).length > 0 ? (
            Object.keys(settings).map((exchange) => (
              <ExchangeSettingsCard key={exchange} exchange={exchange} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No Exchanges Configured</h3>
                <p className="text-sm">
                  Add your first exchange to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 border border-gray-700/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:border-gray-600/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-300">
                    ${getTotalPositionSize().toFixed(0)}
                  </p>
                  <p className="text-gray-400 text-sm">Total Position Size</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 border border-gray-700/40 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:border-gray-600/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-300">
                    {getAverageLeverage().toFixed(1)}x
                  </p>
                  <p className="text-gray-400 text-sm">Average Leverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
