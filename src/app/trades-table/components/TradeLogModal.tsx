"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";

interface TradeLogModalProps {
  entry: {
    id: string;
    type: "trade" | "alert";
    timestamp: string;
    content: string;
    state: string;
    coin: string;
    action: string;
    exchange_response: string | null;
    trade?: {
      id: number;
      discord_id: string;
      trader: string;
      content: string;
      timestamp: string;
      signal_type: string;
      status: string;
      position_size: number;
      exit_price: number | null;
      pnl_usd: number | null;
      exchange_response: string | null;
    };
    alert?: {
      discord_id: string;
      trader: string;
      trade: string;
      timestamp: string;
      content: string;
      status: string;
      parsed_alert?: {
        coin_symbol: string;
        action_determined: {
          action_type: string;
          action_description: string;
          exchange_action: string;
          position_status: string;
          stop_loss: number;
          take_profit: number | null;
          reason: string;
        };
      };
      exchange_response?: string;
    };
  };
  onClose: () => void;
  position?: { x: number; y: number };
}

export function TradeLogModal({
  entry,
  onClose,
  position,
}: TradeLogModalProps) {
  const isTrade = entry.type === "trade";
  const isProfitable =
    isTrade && entry.trade?.pnl_usd && entry.trade.pnl_usd > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute w-full max-w-md"
          style={{
            right: "20px",
            top: position
              ? `${Math.min(position.y, window.innerHeight - 650)}px`
              : "50%",
            transform: position ? "none" : "translateY(-50%)",
            maxHeight: "calc(100vh - 40px)",
          }}
          onClick={(e) => e.stopPropagation()}
          data-modal="trade-log"
        >
          <div
            className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "min(600px, calc(100vh - 40px))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    isTrade
                      ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30"
                      : "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30"
                  }`}
                >
                  {isTrade ? (
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {isTrade
                      ? `Trade #${entry.trade?.id}`
                      : `Alert #${entry.id.slice(-6)}`}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {formatInTimeZone(
                      new Date(entry.timestamp),
                      "Asia/Dubai",
                      "MMM dd, HH:mm"
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg hover:bg-gray-800/50 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isTrade
                          ? entry.trade?.signal_type === "LONG"
                            ? "border-purple-500/50 text-purple-300 bg-purple-500/10"
                            : "border-cyan-500/50 text-cyan-300 bg-cyan-500/10"
                          : "border-orange-500/50 text-orange-300 bg-orange-500/10"
                      }`}
                    >
                      {isTrade ? entry.trade?.signal_type || "TRADE" : "ALERT"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Type</p>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isTrade
                          ? entry.trade?.status === "OPEN"
                            ? "border-green-500/50 text-green-300 bg-green-500/10"
                            : entry.trade?.status === "CLOSED"
                            ? "border-red-500/50 text-red-300 bg-red-500/10"
                            : "border-yellow-500/50 text-yellow-300 bg-yellow-500/10"
                          : entry.alert?.status === "ACTIVE"
                          ? "border-green-500/50 text-green-300 bg-green-500/10"
                          : "border-gray-500/50 text-gray-300 bg-gray-500/10"
                      }`}
                    >
                      {isTrade
                        ? entry.trade?.status || "UNKNOWN"
                        : entry.alert?.status || "UNKNOWN"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Status</p>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-300">
                      {entry.coin || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Asset</p>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1">Trader</p>
                  <Badge
                    variant="outline"
                    className="border-orange-500/50 text-orange-300 bg-orange-500/10 text-xs px-2 py-0.5 truncate"
                  >
                    {isTrade
                      ? entry.trade?.trader || "Unknown"
                      : entry.alert?.trader || "Unknown"}
                  </Badge>
                </div>
              </div>

              {/* Trade-specific cards */}
              {isTrade && (
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                  <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-green-300">
                        {entry.trade?.position_size || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Position Size</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.trade?.pnl_usd !== null ? (
                        <>
                          {isProfitable ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              isProfitable ? "text-green-300" : "text-red-300"
                            }`}
                          >
                            ${entry.trade.pnl_usd.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">P&L (USD)</p>
                  </div>
                </div>
              )}

              {/* Alert-specific cards */}
              {!isTrade && entry.alert?.parsed_alert && (
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                  <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-yellow-300">
                        {entry.alert.parsed_alert.action_determined.action_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Action Type</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-300">
                        {
                          entry.alert.parsed_alert.action_determined
                            .position_status
                        }
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Position Status</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30 flex-shrink-0">
                <p className="text-xs text-gray-400 mb-1">Content</p>
                <p className="text-xs text-gray-200 break-words">
                  {entry.content}
                </p>
              </div>

              {/* Action */}
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30 flex-shrink-0">
                <p className="text-xs text-gray-400 mb-1">Action</p>
                <p className="text-xs text-yellow-300 break-words">
                  {entry.action || "No action specified"}
                </p>
              </div>

              {/* Exchange Response */}
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30 flex-1 flex flex-col overflow-auto">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 flex-shrink-0">
                  <ExternalLink className="w-3 h-3" />
                  Exchange Response
                </p>
                {entry.exchange_response ? (
                  <div className="bg-black/40 rounded-lg p-2 border border-gray-600/30 flex-1 overflow-auto">
                    <pre
                      className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2"
                      style={{
                        scrollbarColor: "#374151 #111827",
                        scrollbarWidth: "thin",
                      }}
                    >
                      {entry.exchange_response}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">
                        No exchange response available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
