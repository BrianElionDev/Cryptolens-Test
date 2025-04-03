import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Query distinct channels from knowledge table
    const { data, error } = await supabase
      .from("knowledge")
      .select(`"channel name"`)
      .order(`"channel name"`)
      .limit(100);

    if (error) {
      console.error("Channels fetch error:", error);
      throw error;
    }

    // Extract unique channel names
    const channels = Array.from(
      new Set(
        data.map((item: { "channel name": string }) => item["channel name"])
      )
    ).filter(Boolean); // Remove any null/empty values

    return NextResponse.json({ channels });
  } catch (error: unknown) {
    console.error("GET Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch channels",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
