export interface Alert {
  discord_id: string;
  trader: string;
  trade: string;
  timestamp: string;
  content: string;
  parsed_alert?: ParsedAlert;
}

// New parsed alert format
export interface ActionDetermined {
  action_type: string;
  action_description: string;
  binance_action: string;
  position_status: string;
  reason: string;
}

export interface ParsedAlert {
  alert_id: number;
  original_content: string;
  processed_at: string;
  action_determined: ActionDetermined;
  original_trade_id: number;
  coin_symbol: string;
  trader: string;
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
