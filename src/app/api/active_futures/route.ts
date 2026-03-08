import supabase from "@/providers/supabaseprovider";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("active_futures")
      .select("*")
      .order("id", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching active futures:", error);
    return NextResponse.json(
      { error: "Failed to fetch active futures" },
      { status: 500 }
    );
  }
}
