"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function TranscriptPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTranscript(null);

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch transcript");
      }

      setTranscript(data.transcript);
      toast({
        title: "Success",
        description: "Transcript fetched successfully!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                    YouTube Transcript
                  </h1>
                </div>

                <p className="text-gray-400 mb-8 pl-14">
                  Get the transcript of any YouTube video in seconds
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
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                        className="pl-5 bg-gray-800/60 border-gray-700/50 text-gray-200 focus-visible:ring-green-500/50 rounded-xl transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 bg-gradient-to-r from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 border border-green-500/50 text-white rounded-xl relative overflow-hidden group transition-all duration-200 shadow-lg shadow-green-900/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/30 to-green-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
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
                          Get Transcript
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
                    Paste any YouTube video URL in the form and submit it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 group hover:bg-gray-800/30 p-3 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 font-medium">2</span>
                </div>
                <div>
                  <h3 className="text-gray-200 font-medium mb-1 group-hover:text-green-300 transition-colors">
                    Get Transcript
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Our service will fetch and process the video transcript for you
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {transcript && (
        <div className="mt-8">
          <Card className="p-6 bg-gray-900/80 backdrop-blur-md border-green-800/40">
            <pre className="whitespace-pre-wrap text-gray-200 font-mono text-sm">
              {transcript}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
} 