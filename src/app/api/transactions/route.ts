import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const { searchParams } = new URL(request.url);

    // Get query parameters for filtering
    const type = searchParams.get("type");
    const asset = searchParams.get("asset");
    const symbol = searchParams.get("symbol");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = searchParams.get("limit") || "1000";
    const offset = searchParams.get("offset") || "0";
    const sortBy = searchParams.get("sortBy") || "time";
    const sortOrder = searchParams.get("sortOrder") || "DESC";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build the query
    let query = supabase
      .from("transaction_history")
      .select("*", { count: "exact" });

    // Apply filters
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    if (asset && asset !== "all") {
      query = query.eq("asset", asset);
    }

    if (symbol && symbol !== "all") {
      query = query.eq("symbol", symbol);
    }

    if (search) {
      query = query.or(
        `type.ilike.%${search}%,asset.ilike.%${search}%,symbol.ilike.%${search}%`
      );
    }

    if (dateFrom) {
      query = query.gte("time", dateFrom);
    }

    if (dateTo) {
      query = query.lte("time", dateTo);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "ASC" });

    // Apply pagination
    query = query.range(
      parseInt(offset),
      parseInt(offset) + parseInt(limit) - 1
    );

    // Execute the query
    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("Transaction history fetch error:", error);
      throw error;
    }

    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}
