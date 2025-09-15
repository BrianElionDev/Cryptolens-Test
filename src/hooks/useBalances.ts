import { useQuery } from "@tanstack/react-query";

interface BalanceData {
  platform: string;
  accountType: string;
  balances: Array<{
    asset: string;
    free: number;
    locked: number;
    total: number;
    usdValue: number;
  }>;
  totalBalanceUSDT: number;
  totalWalletBalance: number;
  totalUnrealizedProfit: number;
  lastUpdated: string;
}

interface UseBalancesOptions {
  platform?: string;
  accountType?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useBalances(options: UseBalancesOptions = {}) {
  const {
    platform,
    accountType,
    enabled = true,
    refetchInterval = 30000,
  } = options;

  return useQuery({
    queryKey: ["balances", platform, accountType],
    queryFn: async (): Promise<BalanceData[]> => {
      const params = new URLSearchParams();
      if (platform) params.append("platform", platform);
      if (accountType) params.append("account_type", accountType);

      const response = await fetch(`/api/balances?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch balances");
      }

      const data = await response.json();
      return data.data;
    },
    enabled,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

export function usePlatformBalances(platform: string, accountType?: string) {
  return useBalances({ platform, accountType });
}

export function useAllPlatforms() {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: async (): Promise<
      Array<{ platform: string; accountType: string }>
    > => {
      const response = await fetch("/api/balances");

      if (!response.ok) {
        throw new Error("Failed to fetch platforms");
      }

      const data = await response.json();
      return data.platforms || [];
    },
    refetchInterval: 30000,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
}
