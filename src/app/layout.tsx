import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { CoinGeckoProvider } from "@/contexts/CoinGeckoContext";

export const metadata: Metadata = {
  title: "CryptoLens-Test",
  description: "Your comprehensive crypto analytics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-poppins">
        <QueryProvider>
          <CoinGeckoProvider>
            <Navbar />
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 6000,
                style: {
                  background: "rgba(15, 23, 18, 0.7)",
                  color: "#E5E7EB",
                  border: "1px solid rgba(22, 163, 74, 0.2)",
                  backdropFilter: "blur(8px)",
                  fontSize: "0.875rem",
                  maxWidth: "400px",
                  padding: "12px 16px",
                  borderRadius: "0.75rem",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                },
              }}
            />
          </CoinGeckoProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
