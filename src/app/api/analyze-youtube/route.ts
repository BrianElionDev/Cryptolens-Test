import { NextResponse } from "next/server";

// Replace with your actual microservice URL
const ANALYSIS_SERVICE_URL ="https://fetch-server-production-0ddc.up.railway.app/api/analysis/test/single";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { message: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Forward the request to the analysis microservice
    // Don't await the full response - just check that the request was accepted
    const response = await fetch(ANALYSIS_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Video_url: url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Analysis service error:", errorData);
      return NextResponse.json(
        { message: errorData.message || "Analysis service error" },
        { status: response.status }
      );
    }

    // Just return a success response without waiting for analysis to complete
    return NextResponse.json({
      message: "Analysis task submitted successfully",
      status: "queued",
      youtube_url: url,
    });
  } catch (error) {
    console.error("Error processing YouTube analysis request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
