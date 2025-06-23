export interface Alert {
  discord_id: string;
  trader: string;
  trade: string;
  timestamp: string;
  content: string;
}

export interface Trade {
  id: number;
  discord_id: string;
  trader: string;
  content: string;
  structured: string;
  timestamp: string;
}
