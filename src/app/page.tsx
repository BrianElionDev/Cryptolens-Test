"use client";

import Features from "@/components/Features";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicPlatformCards } from "@/app/trades-table/components/DynamicPlatformCards";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  TrendingUp,
  Activity,
  DollarSign,
  BarChart3,
  RefreshCw,
  Calendar,
} from "lucide-react";

// Removed old API functions - now using dynamic platform cards

async function fetchPnLData(period: string, platform: string) {
  const response = await fetch(
    `/api/pnl?period=${period}&platform=${platform}`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch P&L data");
  }
  return response.json();
}

export default function Home() {
  const [timePeriod, setTimePeriod] = useState<"day" | "week">("day");
  const [selectedPlatform, setSelectedPlatform] = useState<
    "all" | "binance" | "kucoin"
  >("all");

  // Removed individual platform queries - now using dynamic platform cards

  // Overall P&L data (all platforms)
  const {
    data: overallPnLData,
    isLoading: overallPnLLoading,
    error: overallPnLError,
    refetch: refetchOverallPnL,
  } = useQuery({
    queryKey: ["overall-pnl-data", timePeriod],
    queryFn: () => fetchPnLData(timePeriod, "all"),
    refetchInterval: 30000,
    retry: 3,
  });

  const handleRefreshAll = () => {
    refetchPnL();
    refetchOverallPnL();
  };

  const isLoading = pnlLoading || overallPnLLoading;
  const hasError = pnlError || overallPnLError;

  return (
    <main className="min-h-screen pt-24 flex flex-col bg-gradient-to-br from-black via-blue-950/20 to-black relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-blue-400/5 rounded-full mix-blend-multiply filter blur-xl"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Main content - subtract navbar height */}
      <div className="flex-1 mt-4 scrollbar-hide">
        <div className="min-h-full mx-auto px-4 relative">
          <div className="min-h-full flex flex-col">
            {/* Hero Section - adjusted height */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 xl:gap-16 w-full max-w-7xl mx-auto h-[40vh] lg:h-[45vh]">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 w-full lg:max-w-2xl text-center lg:text-left space-y-4"
              >
                <div className="relative group px-4">
                  <div className="absolute -inset-x-4 -inset-y-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                  <motion.h1
                    className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold relative"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-green-200 green-text-glow">
                      CryptoLens-Test
                    </span>
                  </motion.h1>
                </div>
                <motion.div className="space-y-2">
                  <p className="text-lg md:text-xl lg:text-2xl text-green-300 font-medium leading-tight">
                    CryptoLens Test Environment
                  </p>
                  <p className="text-sm md:text-base lg:text-lg text-gray-300">
                    Test and compare different AI models for crypto content
                    analysis. Experiment with OpenAI GPT-4, Perplexity, and
                    Claude to find the optimal analysis approach.
                  </p>
                </motion.div>
              </motion.div>

              {/* Right Content - reduced size */}
              <motion.div className="flex-1 relative group hidden lg:block">
                <div className="w-48 h-48 xl:w-[250px] xl:h-[250px] relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl group-hover:blur-2xl transition-all duration-500" />

                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full backdrop-blur-sm"
                  />
                  <motion.div
                    animate={{
                      scale: [1.05, 1, 1.05],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute inset-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full backdrop-blur-sm"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2,
                    }}
                    className="absolute inset-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full backdrop-blur-sm"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.svg
                      whileHover={{ scale: 1.1 }}
                      className="w-28 h-28 xl:w-40 xl:h-40 text-green-300 transform transition-transform duration-500 drop-shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:stroke-green-200 transition-colors duration-300"
                      />
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 2,
                          ease: "easeInOut",
                          delay: 0.5,
                        }}
                        d="M15 8.5C14.315 7.81501 13.1087 7.33855 12 7.30872M9 15.5C9.685 16.185 10.8913 16.6614 12 16.6913M12 7.30872C10.7865 7.27668 9.5 7.85001 9.5 9.50001C9.5 12.5 15 11 15 14C15 15.65 13.315 16.7316 12 16.6913M12 7.30872V5.5M12 16.6913V18.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:stroke-green-200 transition-colors duration-300"
                      />
                    </motion.svg>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Features Section - adjusted height */}
            <div className="flex-1 w-full max-w-7xl mx-auto min-h-[35vh]">
              <Features />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-10 lg:pt-10 pb-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-300 to-emerald-400">
              AI Model Testing Platform
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300 mb-8">
              Compare LLM performance across OpenAI, Anthropic, and Perplexity
              models
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/autofetch"
                className="px-8 py-3 rounded-xl glass-border border-blue-500/30 
                          hover:border-blue-400/50 text-blue-300 hover:glass-hover 
                          transition-all duration-200 backdrop-blur-sm 
                          hover:glass-glow"
              >
                Start Testing
              </Link>
              <Link
                href="/categories"
                className="px-8 py-3 rounded-xl glass-border border-purple-500/30 
                          hover:border-purple-400/50 text-purple-300 hover:glass-hover 
                          transition-all duration-200 backdrop-blur-sm 
                          hover:glass-glow"
              >
                Browse Categories
              </Link>
            </div>
          </motion.div>

          <Features />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 glassmorphic glass-border rounded-xl p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-amber-400/5 z-0"></div>
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-amber-100">
                Latest Results
              </h2>
              {/* Latest test results would go here */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glassmorphic-light glass-border rounded-lg p-4">
                  <h3 className="text-amber-300 font-medium mb-2">
                    GPT-4 Performance
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Conversation accuracy: 94%
                  </p>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-amber-500 rounded-full"
                      style={{ width: "94%" }}
                    ></div>
                  </div>
                </div>
                <div className="glassmorphic-light glass-border rounded-lg p-4">
                  <h3 className="text-blue-300 font-medium mb-2">
                    Claude 3 Performance
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Conversation accuracy: 92%
                  </p>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                </div>
                <div className="glassmorphic-light glass-border rounded-lg p-4">
                  <h3 className="text-purple-300 font-medium mb-2">
                    Perplexity Performance
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Conversation accuracy: 88%
                  </p>
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-purple-500 rounded-full"
                      style={{ width: "88%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="glassmorphic glass-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-purple-400/5 z-0"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-4 text-purple-100">
                  Model Comparisons
                </h2>
                <p className="text-gray-400 mb-4">
                  Compare performance metrics across different AI models and
                  versions.
                </p>
                <Link
                  href="/analytics"
                  className="inline-block px-6 py-2 rounded-lg glass-border border-purple-500/30 
                            hover:border-purple-400/50 text-purple-300 hover:glass-hover 
                            transition-all duration-200 backdrop-blur-sm"
                >
                  View Analytics
                </Link>
              </div>
            </div>

            <div className="glassmorphic glass-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-400/5 z-0"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-4 text-blue-100">
                  Test Configuration
                </h2>
                <p className="text-gray-400 mb-4">
                  Create custom test scenarios and configure model parameters.
                </p>
                <Link
                  href="/channels"
                  className="inline-block px-6 py-2 rounded-lg glass-border border-blue-500/30 
                            hover:border-blue-400/50 text-blue-300 hover:glass-hover 
                            transition-all duration-200 backdrop-blur-sm"
                >
                  Configure Tests
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trading Dashboard Section */}
      <div className="pt-10 lg:pt-10 pb-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-300 to-emerald-400">
              Trading Dashboard
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300 mb-8">
              Real-time portfolio and P&L tracking across all platforms
            </p>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center justify-center mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Select
                  value={timePeriod}
                  onValueChange={(value) =>
                    setTimePeriod(value as "day" | "week")
                  }
                >
                  <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <Select
                  value={selectedPlatform}
                  onValueChange={(value) =>
                    setSelectedPlatform(value as "all" | "binance" | "kucoin")
                  }
                >
                  <SelectTrigger className="w-[140px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="kucoin">KuCoin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={handleRefreshAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh All
              </button>
            </div>
          </motion.div>

          {/* Overall Stats Cards */}
          {overallPnLData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Total P&L
                    </span>
                  </div>
                  <p
                    className={`text-3xl font-bold ${
                      overallPnLData.summary.totalPnL > 0
                        ? "text-green-300"
                        : overallPnLData.summary.totalPnL < 0
                        ? "text-red-300"
                        : "text-gray-300"
                    }`}
                  >
                    ${overallPnLData.summary.totalPnL.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {timePeriod === "day" ? "Today" : "This Week"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Win Rate
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-300">
                    {overallPnLData.summary.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {overallPnLData.summary.profitableTrades}/
                    {overallPnLData.summary.totalTrades} trades
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Total Trades
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-purple-300">
                    {overallPnLData.summary.totalTrades}
                  </p>
                  <p className="text-xs text-gray-400">
                    {timePeriod === "day" ? "Today" : "This Week"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Avg P&L
                    </span>
                  </div>
                  <p
                    className={`text-3xl font-bold ${
                      overallPnLData.summary.averagePnL > 0
                        ? "text-green-300"
                        : overallPnLData.summary.averagePnL < 0
                        ? "text-red-300"
                        : "text-gray-300"
                    }`}
                  >
                    ${overallPnLData.summary.averagePnL.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">Per Trade</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dynamic Platform Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <DynamicPlatformCards />
          </motion.div>

          {/* Loading State */}
          {isLoading && !hasError && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <Card className="bg-red-950/20 border-red-500/30 mt-6">
              <CardContent className="p-6 text-center">
                <p className="text-red-300">
                  {pnlError?.message ||
                    overallPnLError?.message ||
                    "Unknown error occurred"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 1024px) {
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </main>
  );
}
