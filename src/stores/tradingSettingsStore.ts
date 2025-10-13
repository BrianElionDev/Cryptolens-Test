import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ExchangeSettings {
  id?: string;
  traderId?: string;
  positionSize: number;
  leverage: number;
  maxPositionSize: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  traderIdNorm?: string;
}

export interface TradingSettings {
  [exchange: string]: ExchangeSettings;
}

interface TradingSettingsStore {
  settings: TradingSettings;
  updateExchangeSetting: (
    exchange: string,
    field: keyof ExchangeSettings,
    value: number | boolean | string
  ) => void;
  updateSettings: (newSettings: TradingSettings) => void;
  resetSettings: () => void;
  getExchangeSettings: (exchange: string) => ExchangeSettings | null;
  isExchangeEnabled: (exchange: string) => boolean;
}

const defaultSettings: TradingSettings = {
  binance: {
    positionSize: 100,
    leverage: 1,
    maxPositionSize: 1000,
    enabled: true,
  },
  kucoin: {
    positionSize: 100,
    leverage: 1,
    maxPositionSize: 1000,
    enabled: true,
  },
};

export const useTradingSettingsStore = create<TradingSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateExchangeSetting: (
        exchange: string,
        field: keyof ExchangeSettings,
        value: string | number | boolean
      ) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [exchange]: {
              ...state.settings[exchange],
              [field]: value,
            },
          },
        }));
      },

      updateSettings: (newSettings: TradingSettings) => {
        set({ settings: newSettings });
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      getExchangeSettings: (exchange: string) => {
        const settings = get().settings;
        return settings[exchange] || null;
      },

      isExchangeEnabled: (exchange: string) => {
        const settings = get().settings;
        return settings[exchange]?.enabled || false;
      },
    }),
    {
      name: "trading-settings-storage",
      version: 1,
    }
  )
);
