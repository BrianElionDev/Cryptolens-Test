export interface Alert {
  discord_id: string;
  trader: string;
  trade: string;
  timestamp: string;
  content: string;
  status: string;
  parsed_alert?: ParsedAlert;
  binance_response?: string;
}

// New parsed alert format
export interface ActionDetermined {
  action_type: string;
  action_description: string;
  binance_action: string;
  position_status: string;
  stop_loss: number;
  take_profit: number | null;
  reason: string;
}

export interface Transaction {
  time: string;
  type: string;
  amount: number;
  asset: string;
  symbol: string;
}

export interface ParsedAlert {
  original_content: string;
  processed_at: string;
  action_determined: ActionDetermined;
  coin_symbol: string;
  trader: string;
  alert_id: number;
  original_trade_id: number;
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
  status: string;
  order_status: string;
  signal_type: string;
  coin_symbol: string;
  position_size: number;
  exchange_order_id: string | null;
  exit_price: number | null;
  entry_price: number | null;
  binance_entry_price: number | null;
  binance_exit_price: number | null;
  binance_response: string | null;
  pnl_usd: number | null;
}
