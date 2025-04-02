"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { KnowledgeItem } from "@/types/knowledge";
import { VideoModal } from "./VideoModal";
import { StatsModal } from "./StatsModal";
import { useState } from "react";

interface KnowledgeItemModalProps {
  item: KnowledgeItem;
  onClose: () => void;
}

export function KnowledgeItemModal({ item, onClose }: KnowledgeItemModalProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute inset-x-0 bottom-0 h-[80vh] bg-black/40 backdrop-blur-xl shadow-2xl rounded-t-xl border border-green-500/20"
        >
          <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-green-500/20 rounded-t-xl">
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="text-lg font-semibold text-green-200">
                  {item.video_title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-green-400">
                    {item["channel name"]}
                  </span>
                  <span className="text-sm text-green-500/50">•</span>
                  <span className="text-sm text-gray-400">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowVideo(true)}
                  className="px-3 py-1.5 text-sm bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/20"
                >
                  Watch Video
                </button>
                <button
                  onClick={() => setShowStats(true)}
                  className="px-3 py-1.5 text-sm bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/20"
                >
                  View Stats
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-green-400" />
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-64px)] p-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.transcript}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {showVideo && (
        <VideoModal
          videoUrl={item.link}
          onClose={() => setShowVideo(false)}
          videoDetails={{
            title: item.video_title,
            channel: item["channel name"],
            date: item.date,
          }}
        />
      )}

      {showStats && (
        <StatsModal item={item} onClose={() => setShowStats(false)} />
      )}
    </>
  );
}
