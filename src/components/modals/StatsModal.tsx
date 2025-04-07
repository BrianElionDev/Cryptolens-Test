"use client";

import { motion } from "framer-motion";
import { X, Search, ChevronUp, ChevronDown } from "lucide-react";
import type { KnowledgeItem } from "@/types/knowledge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useRef, useEffect } from "react";
import React from "react";
import { useCoinGecko } from "@/contexts/CoinGeckoContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useKnowledgeData } from "@/hooks/useCoinData";

interface StatsModalProps {
  item: KnowledgeItem;
  onClose: () => void;
}

interface Project {
  coin_or_project: string;
  marketcap: string;
  rpoints: number;
  total_count: number;
  category?: string[];
  coingecko_matched?: boolean;
  coingecko_data?: {
    id: string;
    symbol: string;
    name: string;
  };
}

interface CoinModel {
  modelName: string;
  rpoints: number;
  count: number;
}

// Update the uniqueCoinsAcrossModels type
interface UniqueCoin {
  name: string;
  models: CoinModel[];
}

export function StatsModal({ item, onClose }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "stats" | "summary" | "transcript" | "comparison"
  >("stats");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchedProjects, setMatchedProjects] = useState<Project[]>([]);
  const [modelComparisons, setModelComparisons] = useState<KnowledgeItem[]>([]);
  const [isLoadingComparisons, setIsLoadingComparisons] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { topCoins, isLoading: isLoadingCoins, matchCoins } = useCoinGecko();
  const { data: knowledgeItems } = useKnowledgeData();

  useEffect(() => {
    const matchProjects = async () => {
      if (!topCoins || isLoadingCoins) return;
      const matched = await matchCoins(item.llm_answer.projects);
      setMatchedProjects(matched.filter((p) => p.coingecko_matched));
    };
    matchProjects();
  }, [topCoins, item.llm_answer.projects, isLoadingCoins, matchCoins]);

  useEffect(() => {
    const fetchModelComparisons = async () => {
      if (!item.link || !knowledgeItems) return;

      setIsLoadingComparisons(true);
      try {
        // Extract video ID from the link for more reliable matching
        const getVideoId = (url: string) => {
          if (!url) return "";
          // YouTube URL patterns
          const regExp =
            /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
          const match = url.match(regExp);
          return match && match[2].length === 11 ? match[2] : "";
        };

        const videoId = getVideoId(item.link);

        if (!videoId) {
          return;
        }

        // First - let's just see ALL items with matching video IDs
        const itemsWithMatchingVideoIds = knowledgeItems.filter((k) => {
          const kVideoId = getVideoId(k.link);
          return kVideoId === videoId;
        });

        // Now apply our filters
        const matchingVideos = itemsWithMatchingVideoIds.filter((k) => {
          // Filter out only items with the same model name
          if (k.model === item.model) {
            return false;
          }

          return true;
        });

        // If we don't have models with matching links, at least use the current model
        const modelsToUse = [...matchingVideos, item];

        // Clear the model name counter to avoid adding numbers
        const modelNameCounts: Record<string, number> = {};

        // Make sure each model has a unique name
        const transformedData: KnowledgeItem[] = modelsToUse.map(
          (modelItem, index) => {
            // Use the original model name as-is, but ensure it's unique
            let modelName = modelItem.model || `Analysis ${index + 1}`;

            // Keep track of model name occurrences to ensure uniqueness
            modelNameCounts[modelName] = (modelNameCounts[modelName] || 0) + 1;

            // Only add a suffix if there are duplicates
            if (modelNameCounts[modelName] > 1) {
              modelName = `${modelName} (${modelNameCounts[modelName]})`;
            }

            return {
              ...modelItem,
              model: modelName,
            };
          }
        );

        // Match coins for each model's projects
        const matchedModelData = await Promise.all(
          transformedData.map(async (modelItem) => ({
            ...modelItem,
            llm_answer: {
              ...modelItem.llm_answer,
              projects: await matchCoins(modelItem.llm_answer.projects),
            },
          }))
        );

        setModelComparisons(matchedModelData);
      } catch {
        // Silent error handling
      } finally {
        setIsLoadingComparisons(false);
      }
    };

    fetchModelComparisons();
  }, [item, matchCoins, knowledgeItems]);

  const validProjects = useMemo(() => {
    return matchedProjects;
  }, [matchedProjects]);

  const matches = useMemo(() => {
    if (!item.transcript || !searchQuery) return [];
    const lines = item.transcript.split("\n");
    const query = searchQuery.toLowerCase();
    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.toLowerCase().includes(query));
  }, [item.transcript, searchQuery]);

  const filteredTranscript = useMemo(() => {
    if (!item.transcript || !searchQuery) return item.transcript;
    return matches.map(({ line }) => line).join("\n");
  }, [item.transcript, searchQuery, matches]);

  const highlightText = (text: string, lineIndex: number) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        const isCurrentMatch = matches[currentMatchIndex]?.index === lineIndex;
        return (
          <span
            key={i}
            ref={
              isCurrentMatch
                ? (el) => {
                    if (el && transcriptRef.current) {
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }
                : undefined
            }
            className={`bg-green-500/20 text-green-200 px-1 rounded ${
              isCurrentMatch ? "ring-2 ring-green-400" : ""
            }`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const navigateMatches = (direction: "next" | "prev") => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const newIndex =
        direction === "next"
          ? (prev + 1) % matches.length
          : prev <= 0
          ? matches.length - 1
          : prev - 1;
      return newIndex;
    });
  };

  useEffect(() => {
    setCurrentMatchIndex(-1);
  }, [searchQuery]);

  const renderLLMAnswer = () => {
    try {
      if (isLoadingCoins) {
        return (
          <div className="mt-4 flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading coin data...</p>
          </div>
        );
      }

      const projects = validProjects;

      if (!projects || projects.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 mb-4 text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
                <path d="M16 3v4M8 3v4M3 9h18" />
                <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No Coin Data Available
            </h3>
            <p className="text-gray-500 max-w-sm">
              There are no coins to analyze in this video yet. Check back later
              for updates.
            </p>
          </div>
        );
      }

      // Sort projects by rpoints in descending order
      const top3Projects = [...projects]
        .sort((a, b) => b.rpoints - a.rpoints)
        .slice(0, 3);

      return (
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-500/20 backdrop-blur-sm">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Coins
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Market Cap
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Total Count
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    R Points
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Categories
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-500/20 bg-black/10">
                {[...projects]
                  .sort((a, b) => Number(b.rpoints) - Number(a.rpoints))
                  .map((project, index) => {
                    const isTopProject = top3Projects.some(
                      (p) => p.coin_or_project === project.coin_or_project
                    );
                    return (
                      <tr
                        key={`${project.coin_or_project}-${index}`}
                        className={`transition-all duration-200 backdrop-blur-sm ${
                          isTopProject
                            ? "bg-green-900/10"
                            : "hover:bg-green-500/5"
                        }`}
                      >
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`font-medium ${
                              isTopProject ? "text-green-200" : "text-gray-300"
                            }`}
                          >
                            {project.coin_or_project}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              project.marketcap === "large"
                                ? "bg-green-900/50 text-green-300 border border-green-500/20"
                                : project.marketcap === "medium"
                                ? "bg-emerald-900/50 text-emerald-300 border border-emerald-500/20"
                                : "bg-red-900/50 text-red-300 border border-red-500/20"
                            }`}
                          >
                            {project.marketcap}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={
                              isTopProject ? "text-green-200" : "text-gray-300"
                            }
                          >
                            {project.total_count}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={
                              isTopProject ? "text-green-200" : "text-gray-300"
                            }
                          >
                            {project.rpoints}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {project.category?.map((cat: string, i: number) => (
                              <Link
                                key={`${project.coin_or_project}-${cat}-${i}`}
                                href={`/categories/${cat
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                                className="px-2 py-0.5 rounded-full text-xs bg-black/50 text-gray-300 border border-green-500/20 hover:bg-green-500/10 hover:text-green-300 transition-colors"
                              >
                                {cat}
                              </Link>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      );
    } catch {
      return <div>Error rendering LLM answer</div>;
    }
  };

  const renderComparisonTab = () => {
    if (isLoadingComparisons) {
      return (
        <div className="mt-4 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading model comparisons...</p>
        </div>
      );
    }

    // If we have no models at all, use the current model and create one alternate model
    if (modelComparisons.length === 0 && item.llm_answer?.projects) {
      // Create two models with the same data but different names
      const currentModelName = item.model || "Unknown Model";

      // Create a synthetic comparison only if needed
      const syntheticModels: KnowledgeItem[] = [
        {
          ...item,
          model: currentModelName,
        },
      ];

      setModelComparisons(syntheticModels);
      return (
        <div className="mt-4 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Creating comparison view...</p>
        </div>
      );
    }

    // Filter out items that don't have projects data
    const validModelComparisons = modelComparisons.filter((model) => {
      // More detailed check
      const hasLlmAnswer = !!model.llm_answer;
      const hasProjects =
        !!model.llm_answer?.projects && model.llm_answer.projects.length > 0;
      const hasMatchedCoins =
        model.llm_answer?.projects?.some((p) => p.coingecko_matched) || false;

      // Debug detailed reasons for exclusion
      const isValid = hasLlmAnswer && hasProjects && hasMatchedCoins;
      if (!isValid) {
        console.log(
          `Model ${model.model} excluded because:`,
          !hasLlmAnswer
            ? "no llm_answer"
            : !hasProjects
            ? "no projects"
            : "no matched coins"
        );
      }

      return isValid;
    });

    // If we have at least 1 valid model with data, proceed with comparison
    // even if we only have one model (we'll show its stats alone)
    if (validModelComparisons.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 mb-4 text-gray-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            No Model Comparisons Available
          </h3>
          <p className="text-gray-500 max-w-sm">
            No valid models with matched coins were found for this video.
          </p>

          <div className="mt-4 text-xs text-gray-500">
            Total models found: {modelComparisons.length} / Valid:{" "}
            {validModelComparisons.length}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-gray-900/40 border border-gray-700/50 max-w-sm">
            <p className="text-sm text-gray-300">
              To compare different models, you need to analyze this video with
              multiple AI models or run the analysis multiple times.
            </p>
          </div>
        </div>
      );
    }

    // Find unique coins across valid models
    const validUniqueCoins = (() => {
      const coinMap = new Map<string, UniqueCoin>();

      validModelComparisons.forEach((modelItem) => {
        modelItem.llm_answer.projects
          .filter((p) => p.coingecko_matched)
          .forEach((project) => {
            if (!coinMap.has(project.coin_or_project)) {
              coinMap.set(project.coin_or_project, {
                name: project.coin_or_project,
                models: [],
              });
            }

            const coinEntry = coinMap.get(project.coin_or_project);
            if (coinEntry) {
              coinEntry.models.push({
                modelName: modelItem.model || "Unknown",
                rpoints: project.rpoints,
                count: project.total_count,
              });
            }
          });
      });

      return Array.from(coinMap.values()).sort(
        (a: UniqueCoin, b: UniqueCoin) => {
          const getRpoints = (model: CoinModel) => model.rpoints;
          const maxRpointsA = Math.max(...a.models.map(getRpoints));
          const maxRpointsB = Math.max(...b.models.map(getRpoints));
          return maxRpointsB - maxRpointsA;
        }
      );
    })();

    return (
      <div className="space-y-8">
        {/* Model Summary Table */}
        <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-700/50">
          <h3 className="text-lg font-medium text-green-200 mb-4">
            Model Comparison Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-500/20 backdrop-blur-sm">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Model Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Total Coins
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                    Total R-Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-500/20 bg-black/10">
                {validModelComparisons.map((model, idx) => {
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-green-500/5 transition-all"
                    >
                      <td className="px-4 py-2 text-sm font-medium text-cyan-200">
                        {model.model || `Model ${idx + 1}`}
                        {model.model === item.model && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-900/50 text-green-300 rounded-full border border-green-500/20">
                            current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {
                          model.llm_answer.projects.filter(
                            (p) => p.coingecko_matched
                          ).length
                        }
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {model.llm_answer.total_rpoints ||
                          model.llm_answer.projects.reduce(
                            (sum, p) => sum + (p.rpoints || 0),
                            0
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {validModelComparisons.length > 1 && validUniqueCoins.length > 0 && (
          <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-700/50">
            <h3 className="text-lg font-medium text-green-200 mb-4">
              Detailed Coin Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-green-500/20 backdrop-blur-sm">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-green-200 uppercase tracking-wider">
                      Coin Name
                    </th>
                    {validModelComparisons.map((model, idx) => {
                      return (
                        <th
                          key={idx}
                          colSpan={2}
                          className="px-4 py-1 text-center text-xs font-medium text-green-200 uppercase tracking-wider border-l border-green-500/20"
                        >
                          {model.model || `Model ${idx + 1}`}
                          {model.model === item.model && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-900/50 text-green-300 rounded-full border border-green-500/20">
                              current
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    <th className="px-4 py-1"></th>
                    {validModelComparisons.map((_, idx) => (
                      <React.Fragment key={`header-subcolumns-${idx}`}>
                        <th className="px-2 py-1 text-center text-xs font-medium text-green-200 uppercase tracking-wider border-l border-green-500/20">
                          R-Points
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-green-200 uppercase tracking-wider">
                          Count
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-500/20 bg-black/10">
                  {validUniqueCoins.map((coin, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-green-500/5 transition-all"
                    >
                      <td className="px-4 py-2 text-sm font-medium text-cyan-200">
                        {coin.name}
                      </td>
                      {validModelComparisons.map((model, modelIdx) => {
                        const modelData = coin.models.find(
                          (m) => m.modelName === model.model
                        );
                        return (
                          <React.Fragment key={`data-${idx}-${modelIdx}`}>
                            <td className="px-2 py-2 text-sm text-center border-l border-green-500/20">
                              {modelData ? (
                                <span className="text-green-300 font-medium">
                                  {modelData.rpoints}
                                </span>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-sm text-center">
                              {modelData ? (
                                <span className="text-gray-300">
                                  {modelData.count}
                                </span>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {validModelComparisons.length <= 1 && (
          <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-700/50">
            <div className="text-center p-4">
              <h3 className="text-lg font-medium text-green-200 mb-4">
                Single Model Analysis
              </h3>
              <p className="text-gray-300 mb-4">
                Only one model analysis is available for this video. To enable
                comparison, analyze the video with different AI models.
              </p>
              <div className="inline-block px-3 py-1 bg-green-900/30 text-green-200 rounded-full border border-green-500/30">
                {validModelComparisons[0]?.model || "Current Model"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/80 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col ring-2 ring-green-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-medium text-cyan-200">
            {item.video_title}
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(
              value as "stats" | "summary" | "transcript" | "comparison"
            )
          }
          className="w-full"
        >
          <TabsList className="grid w-full max-w-[600px] grid-cols-4 bg-gray-900/50 backdrop-blur-sm">
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
              onClick={(e) => e.stopPropagation()}
            >
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
              onClick={(e) => e.stopPropagation()}
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="transcript"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
              onClick={(e) => e.stopPropagation()}
            >
              Transcript
            </TabsTrigger>
            <TabsTrigger
              value="comparison"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
              onClick={(e) => e.stopPropagation()}
            >
              Compare
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto mt-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-green-500/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-green-500/30">
          {activeTab === "stats" ? (
            renderLLMAnswer()
          ) : activeTab === "summary" ? (
            <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-700/50">
              <div className="prose prose-invert max-w-none">
                {item.summary ? (
                  (item.summary || "").split("\n").map((paragraph, index) => {
                    // Handle headers with hashes
                    if (paragraph.startsWith("##")) {
                      return (
                        <h2
                          key={`h2-${index}-${paragraph.slice(0, 20)}`}
                          className="text-2xl font-bold text-green-200/80 mb-6 mt-10 first:mt-0 border-b border-gray-700/50 pb-3"
                        >
                          {paragraph.replace(/##/g, "").trim()}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith("###")) {
                      return (
                        <h3
                          key={`h3-${index}-${paragraph.slice(0, 20)}`}
                          className="text-xl font-bold text-green-200/80 mb-4 mt-8"
                        >
                          {paragraph.replace(/###/g, "").trim()}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith("####")) {
                      return (
                        <h4
                          key={`h4-${index}-${paragraph.slice(0, 20)}`}
                          className="text-lg font-semibold text-green-200/80 mb-3 mt-6"
                        >
                          {paragraph.replace(/####/g, "").trim()}
                        </h4>
                      );
                    }
                    // Handle bullet points with bold text
                    if (paragraph.startsWith("•")) {
                      const content = paragraph.replace("•", "").trim();
                      if (content.includes("**")) {
                        return (
                          <div
                            key={`bullet-bold-${index}-${content.slice(0, 20)}`}
                            className="flex items-start space-x-3 mb-4 group"
                          >
                            <span className="text-green-400 mt-1.5 group-hover:text-green-300 transition-colors text-lg">
                              •
                            </span>
                            <div className="flex-1">
                              {content
                                .split(/(\*\*.*?\*\*)/g)
                                .map((part, i) => {
                                  if (
                                    part.startsWith("**") &&
                                    part.endsWith("**")
                                  ) {
                                    return (
                                      <strong
                                        key={i}
                                        className="text-green-200/80 font-semibold"
                                      >
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return (
                                    <span key={i} className="text-green-200/80">
                                      {part}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`bullet-${index}-${content.slice(0, 20)}`}
                          className="flex items-start space-x-3 mb-4 group"
                        >
                          <span className="text-green-400 mt-1.5 group-hover:text-green-300 transition-colors text-lg">
                            •
                          </span>
                          <p className="text-green-200/80 leading-relaxed flex-1">
                            {content}
                          </p>
                        </div>
                      );
                    }
                    // Handle nested bullet points
                    if (paragraph.startsWith("-")) {
                      const content = paragraph.replace("-", "").trim();
                      if (content.includes("**")) {
                        return (
                          <div
                            key={`nested-bullet-bold-${index}-${content.slice(
                              0,
                              20
                            )}`}
                            className="flex items-start space-x-3 mb-3 group ml-6"
                          >
                            <span className="text-green-400/70 mt-1.5 group-hover:text-green-300 transition-colors">
                              •
                            </span>
                            <div className="flex-1">
                              {content
                                .split(/(\*\*.*?\*\*)/g)
                                .map((part, i) => {
                                  if (
                                    part.startsWith("**") &&
                                    part.endsWith("**")
                                  ) {
                                    return (
                                      <strong
                                        key={i}
                                        className="text-green-200/80 font-semibold"
                                      >
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return (
                                    <span key={i} className="text-gray-200">
                                      {part}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={`nested-bullet-${index}-${content.slice(0, 20)}`}
                          className="flex items-start space-x-3 mb-3 group ml-6"
                        >
                          <span className="text-blue-400/70 mt-1.5 group-hover:text-blue-300 transition-colors">
                            •
                          </span>
                          <p className="text-gray-200 leading-relaxed flex-1">
                            {content}
                          </p>
                        </div>
                      );
                    }
                    // Handle bold text in regular paragraphs
                    if (paragraph.includes("**")) {
                      return (
                        <p
                          key={`bold-${index}-${paragraph.slice(0, 20)}`}
                          className="text-gray-200 mb-4 leading-relaxed"
                        >
                          {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong
                                  key={i}
                                  className="text-cyan-200 font-semibold"
                                >
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return (
                              <span key={i} className="text-gray-200">
                                {part}
                              </span>
                            );
                          })}
                        </p>
                      );
                    }
                    // Regular paragraphs
                    return paragraph ? (
                      <p
                        key={`p-${index}-${paragraph.slice(0, 20)}`}
                        className="text-gray-200 mb-4 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ) : null;
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 mb-4 text-gray-500">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">
                      No Summary Available
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      A summary for this video hasn&apos;t been generated yet.
                      Check back later for updates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "comparison" ? (
            renderComparisonTab()
          ) : (
            <div className="p-6 rounded-xl bg-gray-900/40 border border-gray-700/50">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700/50 focus:border-blue-500/50"
                />
                {searchQuery && matches.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {currentMatchIndex + 1}/{matches.length}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateMatches("prev")}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateMatches("next")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {item.transcript ? (
                <div
                  ref={transcriptRef}
                  className="prose prose-invert max-w-none"
                >
                  {filteredTranscript ? (
                    filteredTranscript.split("\n").map((line, index) => (
                      <p key={index} className="text-gray-200 mb-2">
                        {highlightText(line, index)}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center">
                      No matches found
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 mb-4 text-gray-500">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    No Transcript Available
                  </h3>
                  <p className="text-gray-500 max-w-sm">
                    The transcript for this video hasn&apos;t been generated
                    yet. Check back later for updates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
