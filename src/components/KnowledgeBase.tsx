"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { KnowledgeItem } from "@/types/knowledge";
import { useState, useEffect } from "react";
import { VideoModal } from "./modals/VideoModal";
import { PlayCircle } from "lucide-react";
import { StatsModal } from "./modals/StatsModal";
// Temporarily comment out the CoinGecko context
// import { useCoinGecko } from "@/contexts/CoinGeckoContext";

interface KnowledgeBaseProps {
  items: KnowledgeItem[];
}

export default function KnowledgeBase({ items }: KnowledgeBaseProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [matchedItems, setMatchedItems] = useState<KnowledgeItem[]>([]);
  // Temporarily comment out the CoinGecko hook
  // const { matchCoins } = useCoinGecko();

  useEffect(() => {
    // Directly use items without matching
    setMatchedItems(items);

    // Previous matching code:
    /*
    const matchItems = async () => {
      const matched = await Promise.all(
        items.map(async (item) => ({
          ...item,
          llm_answer: {
            ...item.llm_answer,
            projects: await matchCoins(item.llm_answer.projects),
          },
        }))
      );
      setMatchedItems(matched);
    };
    matchItems();
    */
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {matchedItems.map((item, index) => {
          // Show total count of all projects instead of filtering by match status
          const totalCoins = item.llm_answer.projects.length;

          return (
            <motion.div
              key={`${item.id || ""}-${item.link || ""}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="group relative overflow-hidden rounded-xl glassmorphic-light glass-border p-4 hover:glass-glow transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div className="space-y-3">
                {/* Channel Name */}
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-green-400">
                    {item["channel name"]}
                  </div>
                  {/* Model Indicator */}
                  {item.model && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-900/50 text-cyan-300 border border-cyan-500/20">
                      {item.model}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-200 line-clamp-2 group-hover:text-green-300 transition-colors">
                  {item.video_title}
                </h3>

                {/* Date and Watch Video */}
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="text-sm text-gray-400 shrink-0">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideo(item.link);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 text-sm text-green-400 hover:text-green-300 transition-colors bg-green-500/10 rounded-md hover:bg-green-500/20"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Watch</span>
                    </button>
                    {/* Video Type Indicator */}
                    <div
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        item.video_type === "video"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {item.video_type === "video" ? "Video" : "Short"}
                    </div>
                  </div>
                  {/* Coin Count - Now shows all coins */}
                  <div className="text-sm text-blue-600 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md shrink-0">
                    {totalCoins} coins
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stats Modal */}
      <AnimatePresence>
        {selectedItem && (
          <StatsModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <VideoModal
            videoUrl={activeVideo}
            onClose={() => setActiveVideo(null)}
            videoDetails={{
              title:
                items.find((item) => item.link === activeVideo)?.video_title ||
                "",
              channel:
                items.find((item) => item.link === activeVideo)?.[
                  "channel name"
                ] || "",
              date: items.find((item) => item.link === activeVideo)?.date || "",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
