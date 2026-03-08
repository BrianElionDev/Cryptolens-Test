"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface TradesRow {
  id: number;
  discord_id: string;
  trader: string;
  content: string;
  structured: string;
  timestamp: string;
  trade_group_id: string;
  signal_type: string;
  order_status: string;
  coin_symbol: string;
  is_active: boolean;
  status: string;
  position_size: number;
  exchange_order_id: string | null;
  exit_price: number | null;
  entry_price: number | null;
  binance_entry_price: number | null;
  binance_exit_price: number | null;
  binance_response: string | null;
  pnl_usd: number | null;
  parsed_signal: object;
}

interface BinanceResponseModalProps {
  trade: TradesRow;
  position: { x: number; y: number };
  onClose: () => void;
}

function formatJson(raw: string | null): string {
  if (!raw) return "No response data";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function BinanceResponseModal({
  trade,
  position,
  onClose,
}: BinanceResponseModalProps): React.ReactElement {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(position.y, window.innerHeight - 420),
    left: Math.min(position.x, window.innerWidth - 520),
    zIndex: 9999,
    width: 500,
    maxHeight: 400,
  };

  return (
    <div
      ref={modalRef}
      style={style}
      className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/80">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            Binance Response
          </span>
          <span className="text-xs text-blue-300 font-mono">
            #{trade.exchange_order_id ?? trade.id}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors rounded p-0.5 hover:bg-gray-700"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta row */}
      <div className="flex gap-4 px-4 py-2 bg-gray-800/40 border-b border-gray-700/50 text-xs text-gray-400">
        <span>
          <span className="text-gray-500">Coin: </span>
          <span className="text-blue-300 font-medium">{trade.coin_symbol}</span>
        </span>
        <span>
          <span className="text-gray-500">Status: </span>
          <span className="text-yellow-300 font-medium">{trade.status}</span>
        </span>
        {trade.pnl_usd !== null && (
          <span>
            <span className="text-gray-500">PnL: </span>
            <span
              className={
                trade.pnl_usd >= 0
                  ? "text-green-400 font-medium"
                  : "text-red-400 font-medium"
              }
            >
              {trade.pnl_usd >= 0 ? "+" : ""}
              {trade.pnl_usd.toFixed(2)} USDT
            </span>
          </span>
        )}
      </div>

      {/* JSON body */}
      <div className="overflow-y-auto flex-1 px-4 py-3">
        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
          {formatJson(trade.binance_response)}
        </pre>
      </div>
    </div>
  );
}
