"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import type { Project } from "@/types/knowledge";

interface CoinGeckoData {
  id: string;
  symbol: string;
  name: string;
}

interface CMCData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  market_cap: number;
  volume_24h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_1h: number;
  cmc_id: number;
  rank: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  image: string;
}

interface CoinGeckoContextType {
  topCoins: CoinGeckoData[];
  cmcCoins: Record<string, CMCData>;
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
  matchCoins: (projects: Project[]) => Promise<Project[]>;
}

const CoinGeckoContext = createContext<CoinGeckoContextType | undefined>(
  undefined
);

export function CoinGeckoProvider({ children }: { children: React.ReactNode }) {
  const [topCoins, setTopCoins] = useState<CoinGeckoData[]>([]);
  const [cmcCoins, setCmcCoins] = useState<Record<string, CMCData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [lastCmcFetchTime, setLastCmcFetchTime] = useState(0);
  const matchCache = useRef<
    Map<
      string,
      { matched: boolean; data?: CoinGeckoData | CMCData; source?: string }
    >
  >(new Map());

  // Move arrays into useMemo
  const excludeTerms = useMemo(
    () => [
      "bull",
      "bear",
      "best",
      "wallet",
      "market",
      "trading",
      "exchange",
      "crypto",
      "token",
      "nft",
      "defi",
      "blockchain",
      "mining",
      "staking",
      "price",
      "news",
      "update",
      "analysis",
      "prediction",
      "buy",
      "sell",
      "trade",
      "chart",
      "technical",
      "fundamental",
      "strategy",
      "guide",
      "tutorial",
      "review",
      "vs",
      "versus",
      "compared",
      "comparison",
    ],
    []
  );

  const cleanTerms = useMemo(
    () => [
      "coin",
      "protocol",
      "network",
      "chain",
      "finance",
      "ecosystem",
      "platform",
      "project",
      "token",
      "crypto",
    ],
    []
  );

  // Fetch CMC data
  const fetchCmcData = useCallback(async () => {
    // Only fetch if it's been more than 5 minutes since last fetch
    if (
      Date.now() - lastCmcFetchTime < 5 * 60 * 1000 &&
      Object.keys(cmcCoins).length > 0
    ) {
      console.debug("Using cached CMC data", {
        cachedCoins: Object.keys(cmcCoins).length,
        lastFetchAge: (Date.now() - lastCmcFetchTime) / 1000,
      });
      return;
    }

    try {
      console.debug("Fetching fresh coin data from CoinMarketCap...");
      const response = await fetch("/api/coinmarketcap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fallbackMode: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CMC data: ${response.statusText}`);
      }

      const responseData = await response.json();

      if (responseData.data && typeof responseData.data === "object") {
        console.debug("Successfully fetched CMC data:", {
          coinsReceived: Object.keys(responseData.data).length,
          firstCoin:
            Object.values(responseData.data as Record<string, CMCData>)[0]
              ?.name || "none",
        });

        setCmcCoins(responseData.data as Record<string, CMCData>);
        setLastCmcFetchTime(Date.now());
      } else {
        console.error("Invalid CMC data format:", responseData);
      }
    } catch (err) {
      console.error("Failed to fetch CMC data:", err);
      // Don't show a toast for CMC errors to avoid overwhelming the user
    }
  }, [cmcCoins, lastCmcFetchTime]);

  const matchCoins = useCallback(
    async (projects: Project[]) => {
      // Ensure we have CoinGecko and CMC data
      if (!topCoins.length) return projects;

      return Promise.all(
        projects.map(async (project) => {
          const projectName =
            project.coin_or_project?.toLowerCase().trim() || "";
          if (!projectName) return { ...project, coingecko_matched: false };

          // Check cache first
          const cached = matchCache.current.get(projectName);
          if (cached) {
            return {
              ...project,
              coingecko_matched: cached.source === "coingecko",
              cmc_matched: cached.source === "cmc",
              coingecko_data:
                cached.source === "coingecko" ? cached.data : undefined,
              cmc_data: cached.source === "cmc" ? cached.data : undefined,
            };
          }

          // Skip if the project name contains excluded terms
          if (excludeTerms.some((term) => projectName.includes(term))) {
            matchCache.current.set(projectName, { matched: false });
            return { ...project, coingecko_matched: false };
          }

          // Extract potential ticker if it exists ($XXX)
          const tickerMatch = projectName.match(/\$([a-zA-Z0-9]+)/);
          const ticker = tickerMatch ? tickerMatch[1].toLowerCase() : "";

          // Remove ticker symbols and clean name
          let cleanedName = project.coin_or_project
            .replace(/\s*\(\$[^)]+\)/g, "")
            .replace(/\$[a-zA-Z0-9]+/, "")
            .toLowerCase()
            .trim();

          // Remove common prefixes/suffixes
          cleanTerms.forEach((term) => {
            cleanedName = cleanedName
              .replace(new RegExp(`^${term}\\s+`, "i"), "")
              .replace(new RegExp(`\\s+${term}$`, "i"), "")
              .trim();
          });

          // Skip if cleaned name is too short or contains numbers
          if (cleanedName.length < 2 || /\d/.test(cleanedName)) {
            matchCache.current.set(projectName, { matched: false });
            return { ...project, coingecko_matched: false };
          }

          // Try to find matching coin in CoinGecko
          const matchedCoin = topCoins.find((coin) => {
            const symbol = coin.symbol.toLowerCase().trim();
            const name = coin.name.toLowerCase().trim();

            // First try exact matches
            if (ticker && symbol === ticker) return true;
            if (name === cleanedName) return true;
            if (symbol === cleanedName) return true;

            // Then try partial matches, but be very strict
            return (
              (name.includes(cleanedName) && cleanedName.length > 3) ||
              (cleanedName.includes(name) && name.length > 3)
            );
          });

          // If matched in CoinGecko, cache and return
          if (matchedCoin) {
            matchCache.current.set(projectName, {
              matched: true,
              data: matchedCoin,
              source: "coingecko",
            });
            return {
              ...project,
              coingecko_matched: true,
              coingecko_data: matchedCoin,
            };
          }

          // If no CoinGecko match, try CMC match from our cache
          // Look for ticker match first
          let cmcMatch = null;
          if (ticker) {
            // Check exact ticker match
            const tickerKey = ticker.toLowerCase();
            if (cmcCoins[tickerKey]) {
              cmcMatch = cmcCoins[tickerKey];
            }
          }

          // If no ticker match, try name match
          if (!cmcMatch) {
            // Try to find by name
            for (const key in cmcCoins) {
              const coin = cmcCoins[key];
              const coinName = coin.name.toLowerCase();
              const coinSymbol = coin.symbol.toLowerCase();

              if (
                coinName === cleanedName ||
                coinSymbol === cleanedName ||
                (coinName.includes(cleanedName) && cleanedName.length > 3) ||
                (cleanedName.includes(coinName) && coinName.length > 3)
              ) {
                cmcMatch = coin;
                break;
              }
            }
          }

          if (cmcMatch) {
            matchCache.current.set(projectName, {
              matched: true,
              data: cmcMatch,
              source: "cmc",
            });
            return {
              ...project,
              cmc_matched: true,
              cmc_data: cmcMatch,
            };
          }

          // No match found
          matchCache.current.set(projectName, { matched: false });
          return { ...project, coingecko_matched: false, cmc_matched: false };
        })
      );
    },
    [topCoins, cmcCoins, excludeTerms, cleanTerms]
  );

  const fetchTopCoins = useCallback(async () => {
    try {
      // Only fetch if it's been more than 5 minutes since last fetch
      if (Date.now() - lastFetchTime < 5 * 60 * 1000) {
        console.debug("Using cached coin data", {
          cachedCoins: topCoins.length,
          lastFetchAge: (Date.now() - lastFetchTime) / 1000,
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      console.debug("Fetching fresh coin data from CoinGecko...");

      // Fetch coins in batches of 250
      const allCoins: CoinGeckoData[] = [];
      for (let page = 1; page <= 3; page++) {
        console.debug(`Fetching page ${page} of coins...`);
        try {
          // Use a public CORS proxy to avoid CORS issues with CoinGecko API
          // This is a simple solution - for production, consider setting up your own proxy
          const corsProxyUrl = "https://corsproxy.io/?";
          const targetUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;

          const response = await axios.get(
            corsProxyUrl + encodeURIComponent(targetUrl),
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.data || !Array.isArray(response.data)) {
            throw new Error("Invalid response from CoinGecko API");
          }

          const pageCoins = response.data.map((coin: CoinGeckoData) => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
          }));

          allCoins.push(...pageCoins);

          // Add a longer delay between requests to avoid rate limiting
          if (page < 3) {
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Increased to 3 seconds
          }
        } catch (error) {
          console.error("Error fetching coin data:", error);

          if (axios.isAxiosError(error)) {
            if (error.response?.status === 429) {
              // If rate limited, wait longer and retry
              console.warn("Rate limited by CoinGecko, waiting longer...");
              await new Promise((resolve) => setTimeout(resolve, 10000)); // Increased to 10 seconds
              page--; // Retry this page
              continue;
            }

            if (error.response?.status) {
              throw new Error(
                `CoinGecko API error: ${error.response.status} ${error.response.statusText}`
              );
            }
          }

          throw error;
        }
      }

      console.debug("Successfully fetched coin data:", {
        coinsReceived: allCoins.length,
        firstCoin: allCoins[0]?.name,
        lastCoin: allCoins[allCoins.length - 1]?.name,
        sampleSymbols: allCoins.slice(0, 5).map((c) => c.symbol),
      });

      setTopCoins(allCoins);
      setLastFetchTime(Date.now());

      // After fetching CoinGecko, fetch CMC data
      await fetchCmcData();
    } catch (err) {
      console.error("Failed to fetch top coins:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch coin data from CoinGecko";
      setError(new Error(errorMessage));

      // Show error toast only if it's not a rate limit error
      if (
        !(err instanceof Error && err.message.includes("429")) &&
        topCoins.length === 0
      ) {
        toast(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [topCoins.length, lastFetchTime, fetchCmcData]);

  // Initial fetch
  useEffect(() => {
    void fetchTopCoins();
  }, [fetchTopCoins]);

  // Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchTopCoins();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchTopCoins]);

  const value = {
    topCoins,
    cmcCoins,
    isLoading,
    error,
    refreshData: fetchTopCoins,
    matchCoins,
  };

  return (
    <CoinGeckoContext.Provider value={value}>
      {children}
    </CoinGeckoContext.Provider>
  );
}
export function useCoinGecko() {
  const context = useContext(CoinGeckoContext);
  if (context === undefined) {
    throw new Error("useCoinGecko must be used within a CoinGeckoProvider");
  }
  return context;
}
