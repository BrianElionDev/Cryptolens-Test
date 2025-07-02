import { Suspense } from "react";
import { ChannelContent } from "./components/ChannelContent";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ChannelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-green-950/30 to-black">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-30 sm:opacity-50">
          <div className="absolute top-1/4 -left-20 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-green-600/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
          <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-green-400/5 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] sm:opacity-[0.03]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="flex justify-center items-center min-h-[50vh]">
                <LoadingSpinner />
              </div>
            }
          >
            <ChannelContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
