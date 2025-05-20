"use client";

import { motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// Helper functions
function timeStringToSeconds(timeStr: string): number {
  // Handle various timestamp formats (h:m:s, m:s, or just s)
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    // Format: h:m:s
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    // Format: m:s
    const [m, s] = parts;
    return m * 60 + s;
  } else if (parts.length === 1) {
    // Format: s
    return parts[0];
  }
  return 0; // Invalid format
}

// Format seconds back to a consistent timestamp format
function formatTimeString(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
}

// Validate timestamps to filter out obviously invalid ones
function validateTimestamps(timestamps: string[]): string[] {
  // Max reasonable video length - YouTube allows up to ~12 hours, but most are far shorter
  const MAX_VIDEO_DURATION = 12 * 60 * 60; // 12 hours in seconds
  const MIN_VIDEO_DURATION = 0; // 0 seconds minimum

  // Get normalized timestamps - filter out invalid formats and sort
  const validTimestamps = timestamps
    .map((timestamp) => {
      try {
        const seconds = timeStringToSeconds(timestamp);
        // Check if in valid range
        if (seconds >= MIN_VIDEO_DURATION && seconds <= MAX_VIDEO_DURATION) {
          return { original: timestamp, seconds };
        }
        return null;
      } catch (error) {
        console.error("Error validating timestamp:", error);
        return null;
      }
    })
    .filter((item) => item !== null)
    .sort((a, b) => a!.seconds - b!.seconds)
    .map((item) => item!.original);

  return validTimestamps;
}

// Timestamps modal
interface TimestampModalProps {
  videoId: string;
  projectName: string;
  timestamps: string[];
  onPlay: (timestamp: string) => void;
  onClose: () => void;
}

export function TimestampModal({
  videoId,
  projectName,
  timestamps,
  onPlay,
  onClose,
}: TimestampModalProps) {
  // Get validated timestamps for the timeline markers
  const validatedTimestamps = useMemo(
    () => validateTimestamps(timestamps),
    [timestamps]
  );

  // Use all timestamps for navigation buttons
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(
    validatedTimestamps.length > 0
      ? validatedTimestamps[0]
      : timestamps.length > 0
      ? timestamps[0]
      : null
  );

  const [isLoading, setIsLoading] = useState(true);

  // Simple function to get seconds from a timestamp
  const getSecondsFromTimestamp = (timestamp: string | null): number => {
    if (!timestamp) return 0;
    return timeStringToSeconds(timestamp);
  };

  // Function to calculate duration in seconds of a timestamp
  const getVideoDuration = () => {
    // Find max timestamp to determine overall video length
    let maxSeconds = 0;

    // First check validated timestamps
    validatedTimestamps.forEach((timestamp) => {
      const seconds = timeStringToSeconds(timestamp);
      if (seconds > maxSeconds) maxSeconds = seconds;
    });

    // Add some buffer to the end of the video
    return maxSeconds + 120; // Add 2 minute buffer
  };

  const videoDuration = getVideoDuration();

  // Get percentage position of timestamp on timeline with padding for edge positions
  const getTimelinePosition = (timestamp: string) => {
    if (videoDuration === 0) return 50; // Default center position if duration is unknown

    const timestampSeconds = timeStringToSeconds(timestamp);
    // Constrain positions to the timeline with padding
    // to prevent markers from being cut off at the edges
    const calculatedPosition = (timestampSeconds / videoDuration) * 100;

    // Apply minimum 2% and maximum 98% constraints for marker visibility
    return Math.min(Math.max(calculatedPosition, 2), 98);
  };

  // Hide loader after a set time
  useEffect(() => {
    if (selectedTimestamp) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500); // Give enough time for the iframe to load

      return () => clearTimeout(timer);
    }
  }, [selectedTimestamp]);

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
        className="bg-black/90 rounded-xl p-6 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col ring-2 ring-green-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-cyan-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            {projectName} Mentions ({timestamps.length})
            {validatedTimestamps.length < timestamps.length && (
              <span className="text-xs text-gray-400 ml-2">
                ({validatedTimestamps.length} validated)
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col overflow-hidden flex-1">
          {/* Video preview section */}
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/50 flex items-center justify-center relative">
            {selectedTimestamp ? (
              <>
                {/* Using iframe directly with proper parameters instead of react-youtube */}
                <div className="w-full h-full">
                  <iframe
                    key={`iframe-${selectedTimestamp}`}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?start=${getSecondsFromTimestamp(
                      selectedTimestamp
                    )}&autoplay=1&mute=0&modestbranding=1&rel=0&origin=${encodeURIComponent(
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
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <p>Select a timestamp below to preview</p>
              </div>
            )}
          </div>

          {/* Modern integrated timeline with floating markers - ONLY validated timestamps */}
          {validatedTimestamps.length > 0 && (
            <div className="mt-4 relative px-4">
              <div className="h-14 flex items-center">
                {/* Timeline bar */}
                <div className="w-full h-1.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full relative">
                  {/* Time markers */}
                  {videoDuration > 0 && (
                    <>
                      {/* Start time */}
                      <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                        0:00
                      </div>
                      {/* Middle time */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                        {formatTimeString(Math.floor(videoDuration / 2))}
                      </div>
                      {/* End time */}
                      <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
                        {formatTimeString(videoDuration)}
                      </div>
                    </>
                  )}

                  {/* Timestamp markers - only showing validated ones */}
                  {validatedTimestamps.map((time, index) => {
                    const position = getTimelinePosition(time);
                    const isSelected = selectedTimestamp === time;

                    // Determine label alignment to prevent overflow at edges
                    let labelAlignment = "center";
                    if (position <= 10) labelAlignment = "left";
                    if (position >= 90) labelAlignment = "right";

                    return (
                      <button
                        key={`marker-${index}`}
                        onClick={() => setSelectedTimestamp(time)}
                        className="absolute top-1/2 -translate-y-1/2 hover:scale-125 transition-all duration-150"
                        style={{
                          left: `${position}%`,
                        }}
                        title={`${time}`}
                      >
                        <div
                          className={`rounded-full ${
                            isSelected
                              ? "w-5 h-5 bg-green-400 ring-2 ring-green-400/30 shadow-lg shadow-green-500/20"
                              : "w-3 h-3 bg-green-500/70 hover:bg-green-400"
                          } transition-all`}
                        />
                        <div
                          className={`absolute top-4 whitespace-nowrap text-xs font-medium px-1.5 py-0.5 rounded shadow-sm ${
                            isSelected
                              ? "bg-green-900/80 text-green-200 border border-green-500/30"
                              : "opacity-0 hover:opacity-100"
                          }`}
                          style={{
                            left:
                              labelAlignment === "left"
                                ? "0"
                                : labelAlignment === "right"
                                ? "auto"
                                : "50%",
                            right: labelAlignment === "right" ? "0" : "auto",
                            transform:
                              labelAlignment === "center"
                                ? "translateX(-50%)"
                                : "none",
                          }}
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

          {/* Compact timestamp navigation - showing ALL timestamps */}
          <div className="mt-4 px-1">
            <div className="flex flex-wrap gap-1 justify-center">
              {timestamps.map((time, index) => {
                const isSelected = selectedTimestamp === time;
                const isValidated = validatedTimestamps.includes(time);
                return (
                  <button
                    key={`nav-${index}`}
                    onClick={() => setSelectedTimestamp(time)}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-green-500/40 text-green-100 border border-green-500/50"
                        : isValidated
                        ? "bg-black/40 text-green-300 border border-green-600/50 hover:bg-green-900/30 hover:text-green-200"
                        : "bg-black/40 text-gray-300 border border-gray-800 hover:bg-gray-800/50 hover:text-gray-200"
                    }`}
                    title={`Jump to ${time}${
                      isValidated ? " (validated)" : ""
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTimestamp && (
            <div className="mt-2 flex items-center justify-between text-xs px-1">
              <div className="text-gray-400">
                <span className="text-green-300 font-medium">
                  Currently showing: {selectedTimestamp}
                </span>
                {validatedTimestamps.includes(selectedTimestamp) && (
                  <span className="text-green-500 ml-1">(validated)</span>
                )}
              </div>
              <button
                onClick={() => onPlay(selectedTimestamp)}
                className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-100 rounded-md transition-colors text-xs flex items-center gap-1"
              >
                <span>Fullscreen</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
