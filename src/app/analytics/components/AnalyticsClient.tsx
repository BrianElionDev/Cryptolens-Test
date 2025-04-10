"use client";

import { useState, useMemo, useEffect } from "react";
import { useKnowledgeData } from "@/hooks/useCoinData";
import { GraphsTab } from "./GraphsTab";
import { CategoriesTab } from "./CategoriesTab";
import { CombinedMarketTable } from "@/components/tables/CombinedMarketTable";
import { motion, AnimatePresence } from "framer-motion";
import { ChannelSelector } from "./ChannelSelector";
import { ModelSelector } from "./ModelSelector";
import { AnalyticsTabs, TabType } from "./AnalyticsTabs";
import type { KnowledgeItem } from "@/types/knowledge";
import { BarChart3, TrendingUp, Zap } from "lucide-react";

// Add interface for raw project data
interface RawProjectData {
  coin_or_project: string;
  Rpoints?: number;
  rpoints?: number;
  category?: string[];
}

interface AnalyticsClientProps {
  initialData: KnowledgeItem[];
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const { data: knowledge = initialData, isLoading } = useKnowledgeData();
  const [activeTab, setActiveTab] = useState<TabType>("market");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Process data once and memoize
  const processedData = useMemo(() => {
    console.debug("Processing analytics data...");
    const data = {
      projectDistribution: [] as { name: string; value: number }[],
      projectTrends: new Map<string, { date: string; rpoints: number }[]>(),
      categoryDistribution: [] as { name: string; value: number }[],
      coinCategories: [] as {
        coin: string;
        categories: string[];
        channel: string;
        date: string;
        rpoints: number;
        total_count: number;
        model?: string;
      }[],
      channels: [] as string[],
      uniqueCoins: new Set<string>(),
      models: [] as string[],
    };

    if (!knowledge?.length) {
      return data;
    }

    // Create a Map to track unique coins and their categories
    const coinCategoryMap = new Map<string, Set<string>>();
    const projectMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();
    const channelSet = new Set<string>();
    const modelSet = new Set<string>();
    const coinDates = new Map<
      string,
      { date: string; channel: string; model?: string }[]
    >();

    knowledge.forEach((item: KnowledgeItem) => {
      const projects = item.llm_answer.projects;
      const channel = item["channel name"];
      const model = item.model || "Unknown";
      const date = new Date(item.date).toISOString().split("T")[0];

      channelSet.add(channel);
      modelSet.add(model);

      projects.forEach((project: RawProjectData) => {
        const projectName = project.coin_or_project?.toLowerCase().trim();
        if (!projectName) return; // Skip empty projects

        const rpoints = Number(project.rpoints || project.Rpoints || 0);
        if (rpoints <= 0) return; // Skip projects with no points

        data.uniqueCoins.add(projectName);

        // Track dates and channels for each coin
        if (!coinDates.has(projectName)) {
          coinDates.set(projectName, []);
        }
        coinDates.get(projectName)!.push({ date, channel, model });

        // Update project trends
        if (!data.projectTrends.has(projectName)) {
          data.projectTrends.set(projectName, []);
        }
        const trendData = data.projectTrends.get(projectName)!;
        const existingDateIndex = trendData.findIndex((d) => d.date === date);
        if (existingDateIndex >= 0) {
          trendData[existingDateIndex].rpoints += rpoints;
        } else {
          trendData.push({ date, rpoints });
        }

        // Update project distribution
        const currentPoints = projectMap.get(projectName) || 0;
        projectMap.set(projectName, currentPoints + rpoints);

        // Track unique categories for each coin
        if (project.category) {
          if (!coinCategoryMap.has(projectName)) {
            coinCategoryMap.set(projectName, new Set());
          }
          project.category.forEach((cat) => {
            coinCategoryMap.get(projectName)!.add(cat);
            const currentCount = categoryMap.get(cat) || 0;
            categoryMap.set(cat, currentCount + 1);
          });
        }
      });
    });

    // Convert Maps to arrays
    data.projectDistribution = Array.from(projectMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);

    data.categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // Convert coin categories map to array with dates
    data.coinCategories = Array.from(coinCategoryMap.entries())
      .flatMap(([coin, categories]) => {
        const dates = coinDates.get(coin) || [];
        return dates.map((dateInfo) => ({
          coin,
          categories: Array.from(categories),
          channel: dateInfo.channel,
          model: dateInfo.model,
          date: dateInfo.date,
          rpoints: projectMap.get(coin) || 0,
          total_count: dates.length,
        }));
      })
      .sort((a, b) => b.rpoints - a.rpoints);

    // Add channels with stable sorting
    data.channels = Array.from(channelSet).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // Add models with stable sorting
    data.models = Array.from(modelSet).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    console.debug("Unique coins found:", data.uniqueCoins.size);
    return data;
  }, [knowledge]);

  // Initialize channels with a stable reference
  useEffect(() => {
    if (processedData.channels.length > 0) {
      const stableChannels = [...processedData.channels].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
      setSelectedChannels(stableChannels);
    }

    if (processedData.models.length > 0) {
      const stableModels = [...processedData.models].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
      setSelectedModels(stableModels);
    }
  }, [processedData.channels, processedData.models]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 2xl:px-0 max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-purple-100">
              Market Analytics
            </h1>
            <p className="text-sm text-gray-400">
              Real-time insights from crypto influencers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Live Data</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              AI-Powered
            </span>
          </div>
        </div>
      </div>

      {/* Channel and Model Selectors */}
      <div className="flex justify-end gap-2 mb-4">
        <ModelSelector
          models={processedData.models}
          selectedModels={selectedModels}
          onModelsChange={setSelectedModels}
        />
        <ChannelSelector
          channels={processedData.channels}
          selectedChannels={selectedChannels}
          onChannelsChange={setSelectedChannels}
        />
      </div>

      <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "market" && (
            <CombinedMarketTable
              processedData={processedData}
              selectedChannels={selectedChannels}
              selectedModels={selectedModels}
              onCoinSelect={() => {}}
            />
          )}
          {activeTab === "graphs" && (
            <GraphsTab
              processedData={{
                projectDistribution: processedData.projectDistribution || [],
                projectTrends: processedData.projectTrends || new Map(),
                coinCategories: Array.isArray(processedData.coinCategories)
                  ? processedData.coinCategories
                  : [],
              }}
              selectedChannels={selectedChannels}
              selectedModels={selectedModels}
            />
          )}
          {activeTab === "categories" && (
            <CategoriesTab
              processedData={processedData}
              selectedChannels={selectedChannels}
              selectedModels={selectedModels}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
