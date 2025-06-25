export interface Alert {
  discord_id: string;
  trader: string;
  trade: string;
  timestamp: string;
  content: string;
}

// New JSON format signal
export interface ParsedSignal {
  coin_symbol: string;
  position_type: string;
  entry_prices: number[];
  stop_loss: number;
  take_profits: number[] | null;
  order_type: string;
  risk_level: number | null;
}

export interface Trade {
  id: number;
  discord_id: string;
  trader: string;
  content: string;
  structured: string;
  timestamp: string;
  parsed_signal?: ParsedSignal;
}
