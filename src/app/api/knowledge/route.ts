import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { KnowledgeItem } from "@/types/knowledge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RawProject {
  coin_or_project: string;
  Marketcap?: string;
  marketcap?: string;
  Rpoints?: number;
  rpoints?: number;
  valid?: boolean;
  "Total count"?: number;
  total_count?: number;
  category?: string[];
  timestamps?: string[];
  possible_match?: string;
  found_in?: string;
  action?: string;  
  coin?: {
    id: string;
    name: string;
    symbol: string;
  };
}

interface RawLLMAnswer {
  projects: RawProject[];
  total_count?: number;
  total_rpoints?: number;
}

interface RawKnowledgeItem {
  id: string;
  date: string;
  transcript?: string;
  corrected_transcript?: string;
  video_title: string;
  "channel name": string;
  link?: string;
  answer?: string;
  summary?: string;
  llm_answer?: RawLLMAnswer;
  model?: string;
  video_type?: "short" | "video";
  updated_at?: string;      
}

export async function GET() {
  try {
    const { data: knowledgeData, error } = await supabase
      .from("tests")
      .select("*")
      .order("date", { ascending: false })

    if (error) {
      console.error("Knowledge fetch error:", error);
      throw error;
    }

    if (!knowledgeData || knowledgeData.length === 0) {
      return NextResponse.json({ knowledge: [] });
    }

    const transformedData: KnowledgeItem[] = knowledgeData.map(
      (item: RawKnowledgeItem) => ({
        id: item.id,
        date: item.date,
        transcript: item.transcript,
        corrected_transcript: item.corrected_transcript,
        video_title: item.video_title,
        "channel name": item["channel name"],
        link: item.link || "",
        answer: item.answer || "",
        summary: item.summary || "",
        llm_answer: {
          projects: (item.llm_answer?.projects || []).map((project) => ({
            coin_or_project: project.coin_or_project,
            marketcap: (
              project.Marketcap ||
              project.marketcap ||
              ""
            ).toLowerCase(),
            rpoints: Number(project.Rpoints || project.rpoints || 0),
            valid: project.valid || false,
            total_count: Number(
              project["Total count"] || project.total_count || 0
            ),
            category: Array.isArray(project.category) ? project.category : [],
            timestamps: project.timestamps || [],
            possible_match: project.possible_match || "",
            action: project.action || "",
            found_in: project.found_in || "",
            coin: project.coin || undefined,
          })),
          total_count: item.llm_answer?.total_count || 0,
          total_rpoints: item.llm_answer?.total_rpoints || 0,
          
        },
        model: item.model,
        updated_at: item.updated_at || "",
        video_type: item.video_type || "video", // Default to video if not specified
      })
    );

    return NextResponse.json({ knowledge: transformedData });
  } catch (error: unknown) {
    console.error("GET Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch knowledge data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: "Expected an object or array",
          received: typeof data,
        },
        { status: 400 }
      );
    }

    // Normalize data to array format
    const dataArray = Array.isArray(data)
      ? data
      : Object.keys(data).some((key) => !isNaN(Number(key)))
      ? Object.values(data)
      : [data];

    if (dataArray.length === 0) {
      return NextResponse.json(
        {
          error: "Empty data",
          details: "No items to process",
        },
        { status: 400 }
      );
    }

    // Validate all items before processing
    const validationErrors: string[] = [];
    dataArray.forEach((item: RawKnowledgeItem) => {
      if (!item.id) validationErrors.push("Missing required field: id");
      if (!item.date) validationErrors.push("Missing required field: date");
      if (!item.video_title)
        validationErrors.push("Missing required field: video_title");
      if (!item["channel name"])
        validationErrors.push("Missing required field: channel name");
      if (!item.model) validationErrors.push("Missing required field: model");
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    const transformedData = dataArray.map((item, index) => {
      try {
        // Transform llm_answer to match database structure
        const llm_answer = {
          projects:
            Array.isArray(item.llm_answer) && item.llm_answer[0]?.projects
              ? item.llm_answer[0].projects.map((project: RawProject) => ({
                  coin_or_project: project.coin_or_project,
                  marketcap: (
                    project.Marketcap ||
                    project.marketcap ||
                    ""
                  ).toLowerCase(),
                  rpoints: Number(project.Rpoints || project.rpoints || 0),
                  total_count: Number(
                    project["Total count"] || project.total_count || 0
                  ),
                  category: Array.isArray(project.category)
                    ? project.category
                    : [],
                  coin: project.coin || null,
                }))
              : [],
          total_count: Number(item.llm_answer?.[0]?.total_count || 0),
          total_rpoints: Number(
            item.llm_answer?.[0]?.total_Rpoints ||
              item.llm_answer?.[0]?.total_rpoints ||
              0
          ),
        };

        return {
          date: item.date || new Date().toISOString(),
          transcript: item.transcript,
          video_title: item.video_title,
          "channel name": item.channel_name || item["channel name"],
          link: item.link || "",
          summary: item.answer || "",
          llm_answer,
          created_at: new Date().toISOString(),
          video_type: item.video_type || "video",
        };
      } catch (error) {
        console.error(`Error transforming item ${index}:`, error);
        throw new Error(
          `Failed to transform item ${index}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });

    // Check for existing entries
    const { data: existingData, error: fetchError } = await supabase
      .from("tests")
      .select("link")
      .order("date", { ascending: false });

    if (fetchError) {
      console.error("Database fetch error:", fetchError);
      return NextResponse.json(
        {
          error: "Database error",
          details: "Failed to check for existing entries",
        },
        { status: 500 }
      );
    }

    const existingLinks = new Set(
      existingData.map((item: { link: string }) => item.link)
    );
    const newData = transformedData.filter(
      (item: { link: string }) => !existingLinks.has(item.link)
    );

    if (newData.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new data to update",
        skipped: transformedData.length,
        dataSize: 0,
      });
    }

    // Insert new data
    const { error: insertError } = await supabase.from("tests").insert(newData);

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        {
          error: "Database error",
          details: "Failed to insert new data",
          dbError: insertError.message,
        },
        { status: 500 }
      );
    }

    // Optional revalidation
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) {
        const revalidateUrl = new URL("/api/revalidate", appUrl);
        revalidateUrl.searchParams.set("path", "/knowledge");
        await fetch(revalidateUrl.toString(), { method: "POST" });
      }
    } catch (error) {
      console.warn("Revalidation failed:", error);
      // Non-critical error, continue
    }

    return NextResponse.json({
      success: true,
      message: "Data processed successfully",
      total: transformedData.length,
      added: newData.length,
      skipped: transformedData.length - newData.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
