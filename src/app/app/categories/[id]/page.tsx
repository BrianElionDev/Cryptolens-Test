"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useKnowledgeData } from "@/hooks/useCoinData";
import { KnowledgeItem, Project } from "@/types/knowledge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Users,
  Hash,
  Activity,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";

interface CategoryDetailData {
  id: string;
  name: string;
  market_cap: number;
  volume_24h: number;
  top_3_coins: string[];
}

interface CategoryAnalytics {
  coins: string[];
  totalRpoints: number;
  mentions: number;
  marketCapDistribution: {
    large: number;
    medium: number;
    small: number;
  };
  recentActivity: number;
  coinBreakdown: {
    name: string;
    rpoints: number;
    mentions: number;
  }[];
}

const COLORS = ["#4ade80", "#3b82f6", "#8b5cf6"];

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId =
    typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const { data: knowledge = [], isLoading: knowledgeLoading } =
    useKnowledgeData();
  const router = useRouter();

  const [categoryData, setCategoryData] = useState<CategoryDetailData | null>(
    null
  );
  const [categoryAnalytics, setCategoryAnalytics] =
    useState<CategoryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Special case mappings for known categories
  const specialCategoryIDs: Record<string, string> = {
    "layer-1": "Layer 1",
    "meme-token": "Meme",
    "artificial-intelligence-ai": "AI",
    "gaming-entertainment-social": "Gaming",
    "decentralized-finance-defi": "DeFi",
  };

  // Get a display name for the category (for UI purposes)
  const displayName = useMemo(() => {
    if (categoryData?.name) return categoryData.name;
    if (specialCategoryIDs[categoryId]) return specialCategoryIDs[categoryId];
    return categoryId;
  }, [categoryId, categoryData, specialCategoryIDs]);

  console.log("Rendering CategoryDetailPage with id:", categoryId);

  // Process knowledge data for this category
  const processKnowledgeData = useCallback(() => {
    console.log("Processing knowledge data for category:", categoryId);
    if (!knowledgeLoading && knowledge.length > 0) {
      const coinData = new Map<string, { rpoints: number; mentions: number }>();
      let totalRpoints = 0;
      let totalMentions = 0;
      let recentActivity = 0;
      const marketCapDistribution = { large: 0, medium: 0, small: 0 };
      const categoryCoins = new Set<string>();

      // Create alternate forms of the category name for flexible matching
      const categoryVariants = new Set<string>();

      // Add original category ID and name
      categoryVariants.add(categoryId.toLowerCase());
      if (categoryData?.name) {
        categoryVariants.add(categoryData.name.toLowerCase());
      }

      // Add special mappings variants
      if (
        categoryId === "layer-1" ||
        categoryData?.name?.toLowerCase() === "layer 1"
      ) {
        categoryVariants.add("layer 1");
        categoryVariants.add("layer1");
        categoryVariants.add("l1");
        categoryVariants.add("layer one");
      } else if (
        categoryId === "meme-token" ||
        categoryData?.name?.toLowerCase() === "meme"
      ) {
        categoryVariants.add("meme");
        categoryVariants.add("memes");
        categoryVariants.add("meme coin");
        categoryVariants.add("memecoin");
      } else if (
        categoryId === "gaming-entertainment-social" ||
        categoryData?.name?.toLowerCase().includes("gaming")
      ) {
        categoryVariants.add("gaming");
        categoryVariants.add("game");
        categoryVariants.add("games");
        categoryVariants.add("play to earn");
        categoryVariants.add("p2e");
      } else if (
        categoryId === "artificial-intelligence-ai" ||
        categoryData?.name?.toLowerCase().includes("ai")
      ) {
        categoryVariants.add("ai");
        categoryVariants.add("artificial intelligence");
      } else if (
        categoryId === "decentralized-finance-defi" ||
        categoryData?.name?.toLowerCase().includes("defi")
      ) {
        categoryVariants.add("defi");
        categoryVariants.add("finance");
        categoryVariants.add("decentralized finance");
      }

      // Debug - log all variants we're looking for
      console.log(
        "Looking for category variants:",
        Array.from(categoryVariants)
      );

      knowledge.forEach((item: KnowledgeItem) => {
        const date = new Date(item.date);
        const isRecent =
          !isNaN(date.getTime()) &&
          new Date().getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;

        item.llm_answer.projects.forEach((project: Project) => {
          // Check if project has categories
          if (!project.category || !Array.isArray(project.category)) {
            return;
          }

          // Normalize project categories
          const projectCategories = project.category.map((c) =>
            (c || "").toLowerCase().trim()
          );

          // Check if any of our category variants match any project category
          const categoryMatches = projectCategories.some(
            (projectCat) =>
              // Direct match with any variant
              categoryVariants.has(projectCat) ||
              // Or partial match for special cases
              (categoryId === "layer-1" && projectCat.includes("layer")) ||
              (categoryId === "meme-token" && projectCat.includes("meme")) ||
              (categoryId === "gaming-entertainment-social" &&
                (projectCat.includes("game") ||
                  projectCat.includes("gaming") ||
                  projectCat.includes("meta"))) ||
              (categoryId === "artificial-intelligence-ai" &&
                (projectCat.includes("ai") ||
                  projectCat.includes("intelligence"))) ||
              (categoryId === "decentralized-finance-defi" &&
                (projectCat.includes("defi") || projectCat.includes("finance")))
          );

          if (categoryMatches) {
            if (project.coin_or_project) {
              categoryCoins.add(project.coin_or_project);

              // Update coin breakdown
              if (!coinData.has(project.coin_or_project)) {
                coinData.set(project.coin_or_project, {
                  rpoints: 0,
                  mentions: 0,
                });
              }

              const coin = coinData.get(project.coin_or_project)!;
              const rpoints = Number(project.rpoints) || 0;
              coin.rpoints += isNaN(rpoints) ? 0 : rpoints;
              coin.mentions += 1;

              // Update totals
              totalRpoints += isNaN(rpoints) ? 0 : rpoints;
              totalMentions += 1;

              if (isRecent) recentActivity += 1;

              // Update market cap distribution
              const marketcap = (project.marketcap || "").toLowerCase();
              if (marketcap === "large") marketCapDistribution.large += 1;
              if (marketcap === "medium") marketCapDistribution.medium += 1;
              if (marketcap === "small") marketCapDistribution.small += 1;
            }
          }
        });
      });

      // Log how many matches we found
      console.log(
        `Found ${categoryCoins.size} matching coins for category ${categoryId}`
      );

      // Sort coins by rpoints
      const coinBreakdown = Array.from(coinData.entries())
        .map(([name, data]) => ({
          name,
          rpoints: Math.round(data.rpoints * 100) / 100,
          mentions: data.mentions,
        }))
        .sort((a, b) => b.rpoints - a.rpoints)
        .slice(0, 20); // Top 20 coins

      const analytics = {
        coins: Array.from(categoryCoins),
        totalRpoints: Math.round(totalRpoints * 100) / 100,
        mentions: totalMentions,
        marketCapDistribution,
        recentActivity,
        coinBreakdown,
      };

      console.log("Category analytics processed:", analytics);
      setCategoryAnalytics(analytics);
      setIsLoading(false);
    } else if (!knowledgeLoading) {
      // If knowledge data is loaded but empty
      setIsLoading(false);
    }
  }, [categoryId, categoryData, knowledge, knowledgeLoading]);

  // Fetch category data from CoinGecko API - only once
  useEffect(() => {
    // Skip if no category ID or if we've already fetched
    if (!categoryId || hasFetched) return;

    async function fetchCategoryData() {
      try {
        console.log("Fetching category data for:", categoryId);
        setIsLoading(true);

        // Mark as fetched to prevent loops
        setHasFetched(true);

        const response = await fetch(
          `/api/categories/${encodeURIComponent(categoryId)}?t=${Date.now()}`,
          {
            cache: "no-store",
            // Remove the timeout that was causing issues
          }
        );

        console.log("Response status:", response.status);

        if (response.status === 404) {
          console.error("Category not found, redirecting to 404");
          notFound();
          return;
        }

        if (!response.ok) {
          // Handle other error codes like rate limiting (429) or server errors (500)
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);

          if (response.status === 429 || response.status === 503) {
            setError("CoinGecko API is rate limited. Please try again later.");
          } else {
            setError(`Failed to load category data (${response.status})`);
          }
          return;
        }

        const data = await response.json();
        console.log("Data received:", data);

        if (data.data) {
          console.log("Category data received:", data.data.name);
          setCategoryData(data.data);
        } else {
          console.error("No data property in response", data);
          setError(data.error || "Failed to load category data");
        }
      } catch (error) {
        console.error("Failed to fetch category data:", error);
        setError(
          "Failed to load category data. Please try refreshing the page."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategoryData();
  }, [categoryId, hasFetched]); // Simplified dependencies

  // Process analytics when data changes - separate from fetch
  useEffect(() => {
    if (knowledge.length > 0 && !knowledgeLoading && categoryData) {
      processKnowledgeData();
    } else if (!knowledgeLoading && !isLoading) {
      // If we're not loading either dataset, we can stop the loading state
      setIsLoading(false);
    }
  }, [
    knowledge,
    knowledgeLoading,
    categoryData,
    processKnowledgeData,
    isLoading,
  ]);

  if (error) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 relative">
        <div className="container mx-auto px-4 md:px-6 lg:px-20 py-8">
          <div className="p-6 bg-gray-800/80 backdrop-blur-md border border-red-500/30 rounded-xl">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-gray-300">{error}</p>
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-4">
                Try one of these popular categories instead:
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/categories/layer-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600/30 text-blue-400 hover:bg-blue-900/20"
                  >
                    Layer 1
                  </Button>
                </Link>
                <Link href="/categories/meme-token">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-600/30 text-purple-400 hover:bg-purple-900/20"
                  >
                    Meme Coins
                  </Button>
                </Link>
                <Link href="/categories/gaming">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-600/30 text-green-400 hover:bg-green-900/20"
                  >
                    Gaming
                  </Button>
                </Link>
                <Link href="/categories/artificial-intelligence-ai">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-pink-600/30 text-pink-400 hover:bg-pink-900/20"
                  >
                    AI
                  </Button>
                </Link>
              </div>
            </div>
            <Link href="/categories" className="mt-6 inline-block">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Categories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  // Show a user-friendly message if no data was found for this category
  if (!categoryData) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 relative">
        <div className="container mx-auto px-4 md:px-6 lg:px-20 py-8">
          <div className="p-6 bg-gray-800/80 backdrop-blur-md border border-yellow-500/30 rounded-xl">
            <h2 className="text-xl font-bold text-yellow-400 mb-2">
              No Data Found
            </h2>
            <p className="text-gray-300">
              We couldn't find market data for the category "{categoryId}". This
              may happen if:
            </p>
            <ul className="mt-2 mb-4 list-disc list-inside text-gray-400 space-y-1">
              <li>The category name is misspelled</li>
              <li>The category doesn't exist on CoinGecko</li>
              <li>CoinGecko API rate limits have been reached</li>
            </ul>
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-4">
                Try one of these popular categories instead:
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/categories/layer-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600/30 text-blue-400 hover:bg-blue-900/20"
                  >
                    Layer 1
                  </Button>
                </Link>
                <Link href="/categories/meme-token">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-600/30 text-purple-400 hover:bg-purple-900/20"
                  >
                    Meme Coins
                  </Button>
                </Link>
                <Link href="/categories/gaming">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-600/30 text-green-400 hover:bg-green-900/20"
                  >
                    Gaming
                  </Button>
                </Link>
                <Link href="/categories/artificial-intelligence-ai">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-pink-600/30 text-pink-400 hover:bg-pink-900/20"
                  >
                    AI
                  </Button>
                </Link>
              </div>
            </div>
            <Link href="/categories" className="mt-6 inline-block">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Categories
              </Button>
            </Link>
          </div>

          {/* Show knowledge data if we have it */}
          {categoryAnalytics && categoryAnalytics.coinBreakdown.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                Knowledge Data for {displayName}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
                  <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Top Coins in {displayName}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300">
                            Coin
                          </th>
                          <th className="text-right py-3 px-4 text-gray-300">
                            rPoints
                          </th>
                          <th className="text-right py-3 px-4 text-gray-300">
                            Mentions
                          </th>
                          <th className="text-right py-3 px-4 text-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryAnalytics.coinBreakdown.map((coin) => (
                          <tr
                            key={coin.name}
                            className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                            onClick={() => {
                              const cleanName = coin.name.toLowerCase().trim();
                              const safeId = cleanName
                                .replace(/[^\w\s-]/g, "")
                                .replace(/\s+/g, "-");
                              router.push(`/coin/${safeId}`);
                            }}
                          >
                            <td className="py-3 px-4 font-medium text-gray-100">
                              {coin.name}
                            </td>
                            <td className="py-3 px-4 text-right text-blue-300">
                              {coin.rpoints}
                            </td>
                            <td className="py-3 px-4 text-right text-purple-300">
                              {coin.mentions}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/coin/${coin.name
                                  .toLowerCase()
                                  .replace(/[^\w\s-]/g, "")
                                  .replace(/\s+/g, "-")}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-300 hover:text-white hover:bg-gray-700/50"
                                >
                                  View <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 relative overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-20 py-8 relative z-10">
        <div className="mb-8">
          <Link href="/categories">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 text-gray-300 hover:text-white hover:bg-gray-800/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Categories
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            {displayName}
          </h1>
          {categoryData && (
            <p className="text-gray-400 mt-1">
              Market Cap: ${formatNumber(categoryData.market_cap)} • 24h Volume:
              ${formatNumber(categoryData.volume_24h)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total rPoints"
            value={categoryAnalytics?.totalRpoints || 0}
            icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
            color="blue"
          />
          <MetricCard
            title="Total Mentions"
            value={categoryAnalytics?.mentions || 0}
            icon={<Users className="h-5 w-5 text-purple-400" />}
            color="purple"
          />
          <MetricCard
            title="Unique Coins"
            value={categoryAnalytics?.coins.length || 0}
            icon={<Hash className="h-5 w-5 text-pink-400" />}
            color="pink"
          />
          <MetricCard
            title="Recent Activity"
            value={categoryAnalytics?.recentActivity || 0}
            suffix="in 7d"
            icon={<Activity className="h-5 w-5 text-cyan-400" />}
            color="cyan"
          />
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-1">
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-100"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="coins"
              className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-100"
            >
              Top Coins
            </TabsTrigger>
            {categoryData?.top_3_coins && (
              <TabsTrigger
                value="coingecko"
                className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-100"
              >
                CoinGecko Data
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="analytics"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                  Market Cap Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Large Cap",
                            value:
                              categoryAnalytics?.marketCapDistribution.large ||
                              0,
                          },
                          {
                            name: "Medium Cap",
                            value:
                              categoryAnalytics?.marketCapDistribution.medium ||
                              0,
                          },
                          {
                            name: "Small Cap",
                            value:
                              categoryAnalytics?.marketCapDistribution.small ||
                              0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          percent > 0.05
                            ? `${name}: ${(percent * 100).toFixed(0)}%`
                            : ""
                        }
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} coins`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Top Coins by rPoints
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryAnalytics?.coinBreakdown.slice(0, 10) || []}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} rPoints`, ""]}
                      />
                      <Bar
                        dataKey="rpoints"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="coins"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 gap-4">
              <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Top Coins in {categoryData?.name || categoryId}
                </h3>
                {!categoryAnalytics?.coinBreakdown.length ? (
                  <p className="text-gray-400 py-4 text-center">
                    No coins found for this category in our knowledge data.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300">
                            Coin
                          </th>
                          <th className="text-right py-3 px-4 text-gray-300">
                            rPoints
                          </th>
                          <th className="text-right py-3 px-4 text-gray-300">
                            Mentions
                          </th>
                          <th className="text-right py-3 px-4 text-gray-300">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryAnalytics?.coinBreakdown.map((coin) => (
                          <tr
                            key={coin.name}
                            className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                            onClick={() => {
                              // Format coinId similar to CombinedMarketTable
                              const cleanName = coin.name.toLowerCase().trim();
                              // Remove any special characters that might cause routing issues
                              const safeId = cleanName
                                .replace(/[^\w\s-]/g, "")
                                .replace(/\s+/g, "-");
                              router.push(`/coin/${safeId}`);
                            }}
                          >
                            <td className="py-3 px-4 font-medium text-gray-100">
                              {coin.name}
                            </td>
                            <td className="py-3 px-4 text-right text-blue-300">
                              {coin.rpoints}
                            </td>
                            <td className="py-3 px-4 text-right text-purple-300">
                              {coin.mentions}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/coin/${coin.name
                                  .toLowerCase()
                                  .replace(/[^\w\s-]/g, "")
                                  .replace(/\s+/g, "-")}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-300 hover:text-white hover:bg-gray-700/50"
                                >
                                  View <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="coingecko"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            {categoryData?.top_3_coins &&
            categoryData.top_3_coins.length > 0 ? (
              <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300">
                <h3 className="text-lg font-medium mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Top 3 Coins by CoinGecko
                </h3>
                <div className="flex flex-wrap gap-4 mb-6">
                  {categoryData.top_3_coins.map((coinImageUrl, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-gray-900/60 p-3 rounded-lg border border-gray-700/50"
                    >
                      <img
                        src={coinImageUrl}
                        alt={`Top ${index + 1} coin`}
                        className="h-12 w-12 rounded-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700/50">
                    <h4 className="text-sm text-gray-400 mb-1">Market Cap</h4>
                    <p className="text-xl font-medium text-green-300">
                      ${formatNumber(categoryData.market_cap)}
                    </p>
                  </div>
                  <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-700/50">
                    <h4 className="text-sm text-gray-400 mb-1">24h Volume</h4>
                    <p className="text-xl font-medium text-cyan-300">
                      ${formatNumber(categoryData.volume_24h)}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-400 py-4 text-center">
                  No CoinGecko data available for this category.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-blue-900/50 to-gray-900 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 lg:px-20 py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-28 mb-4" />
          <Skeleton className="h-10 w-72 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card
                key={i}
                className="p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
              >
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-8 w-20" />
              </Card>
            ))}
        </div>

        <Skeleton className="h-10 w-full max-w-md mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-md" />
          </Card>

          <Card className="p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-md" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  icon,
  color = "blue",
}: {
  title: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
  color?: "blue" | "purple" | "pink" | "cyan";
}) {
  const colorClasses = {
    blue: "from-blue-600 to-blue-800 shadow-blue-500/20 border-blue-500/30",
    purple:
      "from-purple-600 to-purple-800 shadow-purple-500/20 border-purple-500/30",
    pink: "from-pink-600 to-pink-800 shadow-pink-500/20 border-pink-500/30",
    cyan: "from-cyan-600 to-cyan-800 shadow-cyan-500/20 border-cyan-500/30",
  };

  return (
    <Card
      className={`p-4 flex flex-col bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm shadow-lg border`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-200">{title}</h3>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-1 text-white">
        {formatNumber(value)}{" "}
        {suffix && (
          <span className="text-sm font-normal text-gray-300">{suffix}</span>
        )}
      </p>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  }
  return num.toString();
}
