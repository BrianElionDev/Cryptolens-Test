"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";

interface ExchangeResponseModalProps {
  trade: {
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
  onClose: () => void;
  position?: { x: number; y: number };
}

export function ExchangeResponseModal({
  trade,
  onClose,
  position,
}: ExchangeResponseModalProps) {
  const isProfitable = trade.pnl_usd && trade.pnl_usd > 0;

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
            left: position ? `${position.x}px` : "50%",
            top: position ? `${position.y}px` : "50%",
            transform: position ? "none" : "translate(-50%, -50%)",
          }}
          onClick={(e) => e.stopPropagation()}
          data-modal="exchange-response"
        >
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Trade #{trade.id}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {formatInTimeZone(
                      new Date(trade.timestamp),
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
              {/* Trade Summary Cards - 3 columns */}
              <div className="grid grid-cols-3 gap-3 flex-shrink-0">
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        trade.signal_type === "LONG"
                          ? "border-purple-500/50 text-purple-300 bg-purple-500/10"
                          : "border-cyan-500/50 text-cyan-300 bg-cyan-500/10"
                      }`}
                    >
                      {trade.signal_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Signal Type</p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        trade.status === "OPEN"
                          ? "border-green-500/50 text-green-300 bg-green-500/10"
                          : trade.status === "CLOSED"
                          ? "border-red-500/50 text-red-300 bg-red-500/10"
                          : "border-yellow-500/50 text-yellow-300 bg-yellow-500/10"
                      }`}
                    >
                      {trade.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Status</p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-green-300">
                      {trade.position_size}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Position Size</p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    {trade.pnl_usd !== null ? (
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
                          ${trade.pnl_usd.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">P&L (USD)</p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
                  <p className="text-xs text-gray-400 mb-1">Trader</p>
                  <Badge
                    variant="outline"
                    className="border-orange-500/50 text-orange-300 bg-orange-500/10 text-xs px-2 py-0.5 truncate"
                  >
                    {trade.trader}
                  </Badge>
                </div>
              </div>

              {/* Trade Content - full width */}
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30 flex-shrink-0">
                <p className="text-xs text-gray-400 mb-1">Trade Content</p>
                <p className="text-xs text-gray-200 break-words">
                  {trade.content}
                </p>
              </div>

              {/* Exchange Response - full width, takes remaining space */}
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30 flex-1 flex flex-col overflow-auto">
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 flex-shrink-0">
                  <ExternalLink className="w-3 h-3" />
                  Exchange Response
                </p>
                {trade.exchange_response ? (
                  <div className="bg-black/40 rounded-lg p-2 border border-gray-600/30 flex-1 overflow-auto">
                    <pre
                      className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2"
                      style={{
                        scrollbarColor: "#374151 #111827",
                        scrollbarWidth: "thin",
                      }}
                    >
                      {trade.exchange_response}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-gray-500">
                      No response available
                    </p>
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
