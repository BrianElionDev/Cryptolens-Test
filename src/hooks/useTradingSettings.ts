import { useTradingSettingsStore } from "@/stores/tradingSettingsStore";

export function useTradingSettings() {
  const store = useTradingSettingsStore();

  return {
    ...store,
    // Helper functions
    getTotalPositionSize: () => {
      return Object.values(store.settings)
        .reduce((sum, config) => sum + config.positionSize, 0);
    },

    getAverageLeverage: () => {
      const exchanges = Object.values(store.settings);
      if (exchanges.length === 0) return 0;

      const totalLeverage = exchanges.reduce(
        (sum, config) => sum + config.leverage,
        0
      );
      return totalLeverage / exchanges.length;
    },
  };
}
