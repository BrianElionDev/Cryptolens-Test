export interface KnowledgeItem {
  id: string;
  date: string;
  transcript?: string;
  corrected_transcript?: string;
  video_title: string;
  "channel name": string;
  link: string;
  summary?: string;
  llm_answer: LLMAnswer;
  model?: string;
  video_type: "short" | "video";
  updated_at: string;
}

export interface LLMAnswer {
  projects: Project[];
  total_count: number;
  total_rpoints: number;
}

export interface Project {
  coin_or_project: string;
  marketcap: string;
  rpoints: number;
  total_count: number;
  category: string[];
  timestamps?: string[];
  coingecko_matched?: boolean;
  cmc_matched?: boolean;
  action?: string;
  valid?: boolean;
  possible_match?: string;
  coingecko_data?: {
    id: string;
    symbol: string;
    name: string;
  };
}
