"use client";

import React, { useState } from "react";
import { PlatformCard } from "./PlatformCard";
import { useAllPlatforms } from "@/hooks/useBalances";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useQuery } from "@tanstack/react-query";

// Function to fetch P&L data for a specific platform
async function fetchPnLData(platform: string, period: string, range?: string) {
  const params = new URLSearchParams({
    period,
    platform,
    ...(range && { range }),
  });

  const response = await fetch(`/api/pnl?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`P&L API error for ${platform}:`, response.status, errorText);
    throw new Error(
      `Failed to fetch P&L data for ${platform}: ${response.status}`
    );
  }
  const data = await response.json();
  return data;
}

export function DynamicPlatformCards() {
  const { data: platforms, isLoading, error } = useAllPlatforms();
  const [pnlRanges, setPnlRanges] = useState<Record<string, string>>({});
  const [refreshingPlatforms, setRefreshingPlatforms] = useState<Set<string>>(
    new Set()
  );

  const handlePnlRangeChange = (platformKey: string, value: string) => {
    setPnlRanges((prev) => ({
      ...prev,
      [platformKey]: value,
    }));
  };

  const handlePnlRefresh = (platformKey: string) => {
    // Mark this platform as refreshing
    setRefreshingPlatforms((prev) => new Set(prev).add(platformKey));

    // Clear the refreshing state after a short delay
    setTimeout(() => {
      setRefreshingPlatforms((prev) => {
        const newSet = new Set(prev);
        newSet.delete(platformKey);
        return newSet;
      });
    }, 1000);
  };

  // Individual platform card component with P&L data
  function PlatformCardWithPnL({
    platformData,
  }: {
    platformData: { platform: string; accountType: string };
  }) {
    const platformKey = `${platformData.platform}-${platformData.accountType}`;
    const currentPnlRange = pnlRanges[platformKey] || "today";

    // Convert range to API parameters
    const getApiParams = (range: string) => {
      switch (range) {
        case "today":
          return { period: "day", range: "today" };
        case "7days":
          return { period: "day", range: "7days" };
        case "30days":
          return { period: "day", range: "30days" };
        default:
          return { period: "day", range: "today" };
      }
    };

    const {
      data: pnlData,
      isLoading: pnlLoading,
      refetch: refetchPnL,
    } = useQuery({
      queryKey: ["pnl-data", platformData.platform, currentPnlRange],
      queryFn: () => {
        const params = getApiParams(currentPnlRange);
        return fetchPnLData(platformData.platform, params.period, params.range);
      },
      refetchInterval: 30000,
      retry: 3,
    });

    const isRefreshing = refreshingPlatforms.has(platformKey);

    return (
      <PlatformCard
        key={platformKey}
        platform={platformData.platform}
        accountType={platformData.accountType}
        pnlData={pnlData}
        pnlRange={currentPnlRange}
        pnlLoading={pnlLoading || isRefreshing}
        onPnlRangeChange={(value) => handlePnlRangeChange(platformKey, value)}
        onPnlRefresh={() => {
          handlePnlRefresh(platformKey);
          refetchPnL();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
        <span className="ml-2 text-gray-400">Loading platforms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-red-200">
          <span className="font-medium">Error loading platforms:</span>
          <span className="text-red-300">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!platforms || platforms.length === 0) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 m-4">
        <div className="text-yellow-200">
          No platforms found in database. Add some balance data to see platform
          cards.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {platforms.map((platformData) => (
        <PlatformCardWithPnL
          key={`${platformData.platform}-${platformData.accountType}`}
          platformData={platformData}
        />
      ))}
    </div>
  );
}
