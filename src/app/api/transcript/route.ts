import { NextResponse } from "next/server";
import {
  YoutubeTranscript,
  YoutubeTranscriptError,
} from "@/app/transcript/youtube-transcript.esm.js";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ message: "URL is required" }, { status: 400 });
    }

    try {
      const transcriptArr = await YoutubeTranscript.fetchTranscript(url, {
        lang: "en",
      });
      const transcript = await formatTranscript(transcriptArr);
      return NextResponse.json({
        success: true,
        transcript: { content: transcript },
      });
    } catch (error: any) {
      // Fallback to external API if local fetch fails
      console.warn(
        "Local YoutubeTranscript failed, falling back to external API:",
        error
      );
      const response = await fetch(
        "https://fetch-server-production-0ddc.up.railway.app/api/youtube/transcript",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ youtube_url: url }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { message: errorData.message || "Analysis service error" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        transcript: data.transcript,
      });
    }
  } catch (error) {
    console.error("Transcript error:", error);
    return NextResponse.json(
      { message: "Failed to process transcript" },
      { status: 500 }
    );
  }
  async function formatTranscript(rawTranscript: any) {
    try {
      const segments =
        typeof rawTranscript === "string"
          ? JSON.parse(rawTranscript)
          : rawTranscript;
      const formattedLines = segments.map((segment: any) => {
        const text = segment.text
          .replace(/&amp;#39;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/\[Music\]/g, "")
          .trim();
        const timestamp = formatTimestamp(segment.duration + segment.offset);
        return `${timestamp} ${text}`;
      });

      return formattedLines.filter((segment: any) => segment).join("\n");
    } catch (error) {
      console.error("Error formatting transcript:", error);
      return null;
    }
  }
  function formatTimestamp(ms: any) {
    const hours = Math.floor(ms / 3600)
      .toString()
      .padStart(2, "0");
    ms %= 3600;
    const minutes = Math.floor(ms / 60)
      .toString()
      .padStart(2, "0");
    ms %= 60;
    const seconds = Math.floor(ms / 1)
      .toString()
      .padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }
}
