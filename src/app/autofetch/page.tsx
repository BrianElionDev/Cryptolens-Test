"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BrainCircuit } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Define model types with their configurations
type ModelConfig = {
  id: string;
  name: string;
  description: string;
  color: string;
};

const AI_MODELS: ModelConfig[] = [
  {
    id: "openai",
    name: "OpenAI GPT-4",
    description: "Most capable model for complex analysis",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Fast and efficient for quick insights",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "grok",
    name: "Grok",
    description: "Witty and sharp with real-time insights",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Most capable model for complex analysis",
    color: "from-blue-500 to-red-500",
  },
];

export default function AutofetchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedModel) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an AI model",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post("/api/autofetch", { model: selectedModel });

      toast({
        title: "Success",
        description: "Analysis started successfully!",
        className: "bg-green-800 border-green-900 text-white",
      });

      setTimeout(() => {
        router.push("/knowledge");
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start analysis. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      <Toaster />
      <div className="container max-w-2xl mx-auto px-4">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-60 animate-pulse"></div>

          <Card className="relative border-gray-800/40 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-purple-500/10">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pb-1">
                    AI Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-100 text-base">
                    Select an AI model to analyze content
                  </CardDescription>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-purple-800/40 shadow-inner">
                  <BrainCircuit className="w-7 h-7 text-purple-400/90" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* AI Model Selection */}
                <div className="grid grid-cols-1 gap-4">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModel(model.id)}
                      className={`relative p-4 rounded-lg border transition-all ${
                        selectedModel === model.id
                          ? `border-${
                              model.color.split("-")[1]
                            }-500/50 bg-gradient-to-br ${
                              model.color
                            }/20 shadow-sm`
                          : "border-gray-800/50 bg-gray-900/40 hover:bg-gray-800/40"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${model.color}/20 flex items-center justify-center`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-br ${model.color}`}
                          ></div>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-gray-100">
                            {model.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {model.description}
                          </p>
                        </div>
                        {selectedModel === model.id && (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 mt-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Analysis...
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
