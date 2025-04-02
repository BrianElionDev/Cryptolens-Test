import { Suspense } from "react";
import { ChannelContent } from "./components/ChannelContent";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ChannelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-green-950/30 to-black pt-5">
      {/* Background Animation - Only visible on larger screens */}
      <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-green-600/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-xl" />
          <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-green-400/5 rounded-full mix-blend-multiply filter blur-xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Main Content */}
      <main className="pt-20 pb-16 px-2 md:px-4">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <Suspense fallback={<LoadingSpinner />}>
            <ChannelContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
