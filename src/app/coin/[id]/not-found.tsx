import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CoinsIcon } from "lucide-react";

export default function CoinNotFound() {
  return (
    <main className="container mx-auto p-4 mt-24 min-h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="p-12 rounded-2xl glassmorphic glass-border flex flex-col items-center">
        <CoinsIcon className="w-16 h-16 text-green-400 animate-bounce" />
        <h1 className="text-3xl font-bold text-green-100 mt-6">
          Coin Not Found
        </h1>
        <p className="text-gray-400 text-center max-w-md mt-4">
          The coin you are looking for does not exist or could not be loaded.
          Please try again later.
        </p>
        <Button asChild className="mt-8">
          <Link
            href="/"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Back to Home
          </Link>
        </Button>
      </div>
    </main>
  );
}
