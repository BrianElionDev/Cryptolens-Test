"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function YouTubeAnalysisPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Replace with your actual microservice endpoint
      const response = await fetch("/api/analyze-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Analysis started! You'll be notified when it's ready.",
        });
        router.push("/knowledge");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to start analysis",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting YouTube URL:", error);
      toast({
        title: "Error",
        description: "Failed to connect to analysis service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto pt-28 pb-12 px-4">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <div className="relative">
            {/* Animated background gradients */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-emerald-400/20 rounded-2xl blur-lg animate-pulse"></div>

            <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl border border-green-800/40 shadow-xl overflow-hidden">
              {/* Decorative top pattern */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-green-600/20 to-transparent"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>

              <div className="relative p-8">
                <div className="flex items-center mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mr-4 shadow-lg shadow-green-600/20">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-300 to-green-200 text-transparent bg-clip-text">
                    YouTube Analysis
                  </h1>
                </div>

                <p className="text-gray-400 mb-8 pl-14">
                  Submit a YouTube URL and our AI will analyze its content for
                  crypto insights
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 group">
                    <label
                      htmlFor="youtube-url"
                      className="text-sm text-gray-300 font-medium flex items-center gap-2 group-focus-within:text-green-400 transition-colors"
                    >
                      <svg
                        className="h-4 w-4 text-gray-500 group-focus-within:text-green-400 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      YouTube URL
                    </label>
                    <div className="relative">
                      <Input
                        id="youtube-url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="pl-5 bg-gray-800/60 border-gray-700/50 text-gray-200 focus-visible:ring-green-500/50 rounded-xl transition-all"
                      />
                      {/*  */}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 border border-green-500/50 text-white rounded-xl relative overflow-hidden group transition-all duration-200 shadow-lg shadow-green-900/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/30 to-green-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5 text-green-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Start Analysis
                        </>
                      )}
                    </span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-green-800/30 p-6 h-full">
            <h2 className="text-xl font-bold text-green-300 mb-6 flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              How It Works
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4 group hover:bg-gray-800/30 p-3 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 font-medium">1</span>
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium mb-1 group-hover:text-green-300 transition-colors">
                    Submit YouTube URL
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Paste any crypto-related YouTube video URL in the form and
                    submit it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 group hover:bg-gray-800/30 p-3 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 font-medium">2</span>
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium mb-1 group-hover:text-green-300 transition-colors">
                    AI Processing
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Our AI analyzes the video content, extracting mentions of
                    cryptocurrencies and key information
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 group hover:bg-gray-800/30 p-3 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 font-medium">3</span>
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium mb-1 group-hover:text-green-300 transition-colors">
                    View Results
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Results will appear in the Knowledge section when processing
                    is complete
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-green-900/30">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-300 text-sm flex items-start gap-2">
                  <svg
                    className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>
                    Analysis can take several minutes depending on video length
                    and complexity
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
