export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

export const API_ENDPOINTS = {
  COIN: {
    DETAILS: (symbol: string) => `${BASE_URL}/api/coin/${symbol}`,
    HISTORY: (symbol: string) => `${BASE_URL}/api/coin/${symbol}/history`,
  },
  KNOWLEDGE: {
    BASE: `${BASE_URL}/api/tests`,
    ENTRY: (id: string) => `${BASE_URL}/api/tests/${id}`,
  },
  COINGECKO: `${BASE_URL}/api/coingecko`,
} as const;
