import { NextResponse } from "next/server";

const analysisApiUrl =
  "https://fetch-server-test-production.up.railway.app/api/analysis/test/batch";

if (!analysisApiUrl) {
  throw new Error("Missing ANALYSIS_API_URL environment variable");
}

export async function POST(request: Request) {
  try {
    const { model } = await request.json();

    // Validate required fields
    if (!model) {
      return NextResponse.json(
        { error: "AI model is required" },
        { status: 400 }
      );
    }

    // Send to analysis microservice
    const response = await fetch(analysisApiUrl as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model }),
    });

    if (!response.ok) {
      throw new Error(`Analysis service error: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Analysis started successfully",
      details: result,
    });
  } catch (error: unknown) {
    console.error("POST Error:", error);
    return NextResponse.json(
      {
        error: "Failed to start analysis",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
