"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { useRefreshAll } from "@/hooks/useRefreshAll";

export function RefreshAllButton() {
  const { mutate: refreshAll, isPending } = useRefreshAll();

  return (
    <button
      onClick={() => refreshAll()}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/40 hover:border-blue-400/60 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      title="Refresh all account data"
    >
      <RefreshCw
        className={`w-4 h-4 text-blue-300 ${
          isPending ? "animate-spin" : ""
        }`}
        style={{
          animation: isPending ? "spin 1s linear infinite" : "none",
        }}
      />
      <span className="text-sm font-medium text-white">
        {isPending ? "Refreshing..." : "Refresh All"}
      </span>
    </button>
  );
}
