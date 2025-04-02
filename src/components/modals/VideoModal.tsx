"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface VideoDetails {
  title: string;
  channel: string;
  date: string;
}

interface VideoModalProps {
  videoUrl: string;
  onClose: () => void;
  videoDetails: VideoDetails;
}

const getVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export function VideoModal({
  videoUrl,
  onClose,
  videoDetails,
}: VideoModalProps) {
  const videoId = getVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="fixed inset-0 md:flex md:items-center md:justify-center md:p-4">
        <motion.div
          initial={{ opacity: 0, y: "100%", scale: 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: "100%", scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute bottom-0 w-full md:relative md:max-w-5xl bg-black/40 backdrop-blur-xl shadow-2xl md:rounded-xl overflow-hidden rounded-t-xl border border-green-500/20"
        >
          <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-green-500/20">
            <div className="flex items-start md:items-center justify-between p-3 md:p-4">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-base md:text-lg font-semibold text-green-200 truncate">
                  {videoDetails.title}
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                  <span className="text-xs md:text-sm text-green-400 truncate">
                    {videoDetails.channel}
                  </span>
                  <span className="hidden md:inline text-sm text-green-500/50 flex-shrink-0">
                    •
                  </span>
                  <span className="text-xs md:text-sm text-gray-400 flex-shrink-0">
                    {new Date(videoDetails.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 hover:bg-green-500/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-green-400" />
              </button>
            </div>
          </div>
          <div className="p-2 md:p-4">
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-green-500/20">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
