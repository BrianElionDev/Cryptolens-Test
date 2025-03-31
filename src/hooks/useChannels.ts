import { useMemo } from "react";
import { useKnowledgeData } from "./useCoinData";

export function useChannels() {
  const { data: knowledgeData, isLoading, isError } = useKnowledgeData();

  const channels = useMemo(() => {
    if (!knowledgeData) return [];

    // Extract unique channel names
    const uniqueChannels = Array.from(
      new Set(knowledgeData.map((item) => item["channel name"]).filter(Boolean))
    ).sort();

    return uniqueChannels;
  }, [knowledgeData]);

  return {
    channels,
    isLoading,
    isError,
  };
}
