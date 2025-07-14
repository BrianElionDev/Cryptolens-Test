import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { message: "URL is required" },
        { status: 400 }
      );
    }


    const response = await fetch("https://fetch-server-production-0ddc.up.railway.app/api/youtube/transcript", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ youtube_url: url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Analysis service error:", errorData);
      return NextResponse.json(
        { message: errorData.message || "Analysis service error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      transcript: data.transcript
    });

  } catch (error) {
    console.error("Transcript error:", error);
    return NextResponse.json(
      { message: "Failed to process transcript" },
      { status: 500 }
    );
  }
} 