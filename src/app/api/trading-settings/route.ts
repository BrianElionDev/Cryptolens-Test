import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Fetch trading settings from Supabase
    const { data, error } = await supabase
      .from("trader_exchange_config")
      .select("*")
      .order("exchange");

    if (error) {
      throw error;
    }

    // Transform the data to match the expected format
    const settings: { [key: string]: Record<string, unknown> } = {};

    if (data && data.length > 0) {
      data.forEach((row) => {
        settings[row.exchange] = {
          id: row.id,
          traderId: row.trader_id,
          positionSize: row.position_size || 100,
          leverage: row.leverage || 1,
          maxPositionSize: 1000, // Default since not in new table
          enabled: true, // Default since not in new table
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          updatedBy: row.updated_by,
          traderIdNorm: row.trader_id_norm,
        };
      });
    }

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch trading settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings, action } = body;

    // Handle different actions
    if (action === "add_exchange") {
      const { exchange, traderId, leverage, positionSize } = body;

      if (!exchange || !traderId) {
        return NextResponse.json(
          { error: "Exchange and trader ID are required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("trader_exchange_config")
        .insert({
          trader_id: traderId,
          exchange: exchange,
          leverage: leverage || 1,
          position_size: positionSize || 100,
          updated_by: "admin", // You might want to get this from auth
        })
        .select();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: "Exchange added successfully",
        data: data[0],
      });
    }

    // Handle updating existing settings
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 }
      );
    }

    // Update each exchange setting
    for (const [exchange, exchangeSettings] of Object.entries(settings)) {
      try {
        const es = exchangeSettings as Record<string, unknown>;
        const traderId =
          typeof es.traderId === "string" ? (es.traderId as string) : undefined;
        // trader_id_norm is a generated column in DB; don't write it
        const leverage =
          typeof es.leverage === "number"
            ? (es.leverage as number)
            : Number(es.leverage);
        const positionSize =
          typeof es.positionSize === "number"
            ? (es.positionSize as number)
            : Number(es.positionSize);

        const updatePayload: Record<string, unknown> = {
          updated_by: "admin",
        };

        if (!Number.isNaN(leverage)) updatePayload.leverage = leverage;
        if (!Number.isNaN(positionSize))
          updatePayload.position_size = positionSize;
        if (typeof traderId !== "undefined") updatePayload.trader_id = traderId;

        // Do not send trader_id_norm; DB computes it

        const { error: updateError } = await supabase
          .from("trader_exchange_config")
          .update(updatePayload)
          .eq("exchange", exchange);

        if (updateError) {
          console.error(
            "Supabase update error for exchange",
            exchange,
            updateError
          );
          return NextResponse.json(
            { error: `Failed to update ${exchange}: ${updateError.message}` },
            { status: 400 }
          );
        }
      } catch (innerErr: unknown) {
        console.error("Unexpected error updating exchange", exchange, innerErr);
        return NextResponse.json(
          { error: `Unexpected error updating ${exchange}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Trading settings saved successfully",
      settings,
    });
  } catch (e: unknown) {
    console.error("POST /api/trading-settings failed", e);
    const message =
      typeof e === "object" && e && "message" in e
        ? (e as any).message
        : "Failed to save trading settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
