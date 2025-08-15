import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Alert, Trade } from "@/types/wealthgroup";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    // Real Supabase data
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const [alertsResponse, tradesResponse] = await Promise.all([
      supabase
        .from("alerts")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1000),
      supabase
        .from("trades")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1000),
    ]);

    if (alertsResponse.error) {
      console.error("Alerts fetch error:", alertsResponse.error);
      throw alertsResponse.error;
    }

    if (tradesResponse.error) {
      console.error("Trades fetch error:", tradesResponse.error);
      throw tradesResponse.error;
    }

    const alerts: Alert[] = alertsResponse.data || [];
    const trades: Trade[] = tradesResponse.data || [];

    return NextResponse.json({ alerts, trades });
  } catch (error: unknown) {
    console.error("GET Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch wealthgroup data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
