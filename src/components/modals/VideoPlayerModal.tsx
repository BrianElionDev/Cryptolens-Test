"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

// Helper functions
function timeStringToSeconds(timeStr: string): number {
  const [h, m, s] = timeStr.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

// // Validate timestamps to filter out obviously invalid ones
// function validateTimestamps(timestamps: string[]): string[] {
//   // Max reasonable video length - YouTube allows up to ~12 hours, but most are far shorter
//   const MAX_VIDEO_DURATION = 2 * 60 * 60; // 2 hours in seconds

//   // Filter out timestamps that exceed our maximum reasonable duration
//   return timestamps.filter((timestamp) => {
//     const seconds = timeStringToSeconds(timestamp);
//     return seconds <= MAX_VIDEO_DURATION;
//   });
// }

interface VideoPlayerModalProps {
  videoId: string;
  timestamp: string;
  timestamps: string[];
  onClose: () => void;
}

export function VideoPlayerModal({
  videoId,
  timestamp,
  timestamps,
  onClose,
}: VideoPlayerModalProps) {
  // Use all timestamps directly, no filtering
  const initialTimestamp = useMemo(() => {
    if (timestamps.includes(timestamp)) return timestamp;
    return timestamps.length > 0 ? timestamps[0] : "";
  }, [timestamp, timestamps]);

  const [currentTimestamp, setCurrentTimestamp] =
    useState<string>(initialTimestamp);

  const [isLoading, setIsLoading] = useState(true);

  // Simple function to get seconds from a timestamp
  const getSecondsFromTimestamp = (timestamp: string): number => {
    return timeStringToSeconds(timestamp);
  };

  // Function to calculate duration in seconds of a timestamp
  const getVideoDuration = () => {
    // Find max timestamp to determine overall video length
    let maxSeconds = 0;
    timestamps.forEach((timestamp) => {
      const seconds = timeStringToSeconds(timestamp);
      if (seconds > maxSeconds) maxSeconds = seconds;
    });
    // Add some buffer to the end of the video
    return maxSeconds + 60; // Add 1 minute buffer
  };

  const videoDuration = getVideoDuration();

  // Get percentage position of timestamp on timeline
  const getTimelinePosition = (timestamp: string) => {
    const timestampSeconds = timeStringToSeconds(timestamp);
    return Math.min((timestampSeconds / videoDuration) * 100, 100);
  };

  // Hide loader after a set time
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Give enough time for the iframe to load

    return () => clearTimeout(timer);
  }, [currentTimestamp]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 rounded-xl p-4 w-full max-w-5xl relative ring-1 ring-green-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-1 right-1 p-1.5 bg-black/70 hover:bg-gray-800 rounded-lg transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>

        <div className="aspect-video w-full overflow-hidden rounded-lg flex items-center justify-center relative">
          {/* Using iframe directly with proper parameters */}
          <div className="w-full h-full">
            <iframe
              key={`iframe-${currentTimestamp}`}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?start=${getSecondsFromTimestamp(
                currentTimestamp
              )}&autoplay=1&mute=1&modestbranding=1&rel=0&origin=${encodeURIComponent(
                window.location.origin
              )}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full"
            ></iframe>
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="w-8 h-8 border-2 border-t-green-500 border-green-500/20 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Modern integrated timeline */}
        {timestamps.length > 0 && (
          <div className="mt-2 relative">
            <div className="h-10 flex items-center">
              {/* Timeline bar */}
              <div className="w-full h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full relative">
                {/* Timestamp markers */}
                {timestamps.map((time, index) => {
                  const position = getTimelinePosition(time);
                  const isSelected = currentTimestamp === time;
                  return (
                    <button
                      key={`marker-full-${index}`}
                      onClick={() => setCurrentTimestamp(time)}
                      className="absolute top-1/2 -translate-y-1/2 hover:scale-125 transition-all duration-150"
                      style={{
                        left: `${position}%`,
                      }}
                      title={`${time}`}
                    >
                      <div
                        className={`rounded-full ${
                          isSelected
                            ? "w-4 h-4 bg-green-400 ring-2 ring-green-400/30 shadow-lg shadow-green-500/20"
                            : "w-3 h-3 bg-green-500/70 hover:bg-green-400"
                        } transition-all`}
                      />
                      <div
                        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${
                          isSelected
                            ? "bg-green-900/80 text-green-200 border border-green-500/30"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {time}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Compact timestamp pills */}
        {timestamps && timestamps.length > 1 && (
          <div className="mt-2 flex justify-center overflow-hidden">
            <div className="flex flex-wrap justify-center gap-1">
              {timestamps.map((time, index) => {
                const isSelected = currentTimestamp === time;
                return (
                  <button
                    key={`nav-full-${index}`}
                    onClick={() => setCurrentTimestamp(time)}
                    className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-green-500/40 text-green-100 border border-green-500/50"
                        : "bg-black/40 text-gray-300 border border-gray-800 hover:bg-green-900/30 hover:text-green-200"
                    }`}
                    title={`Jump to ${time}`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2 text-center text-xs text-gray-400">
          <span className="text-green-300 font-medium">{currentTimestamp}</span>{" "}
          - Click on timeline to navigate to timestamps
        </div>
      </motion.div>
    </motion.div>
  );
}
