import { NextResponse } from "next/server";

// Disable all Next.js optimizations that are causing our error
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Explicitly tell Next.js this is a static route within
// the dynamic segment (eliminates the params error)
export const preferredRegion = "auto";
export const runtime = "edge";

// Shared cache structure from the main categories endpoint
interface CategoryData {
  id: string;
  name: string;
  market_cap: number;
  volume_24h: number;
  top_3_coins: string[];
}

// We'll use a local cache for this specific dynamic route
const categoryCache = new Map<
  string,
  { data: CategoryData; timestamp: number }
>();

// The actual route handler
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    const now = Date.now();
    const cachedData = categoryCache.get(categoryId);

    if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
      return NextResponse.json(cachedData.data);
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/categories/${categoryId}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const data = await response.json();
    categoryCache.set(categoryId, { data, timestamp: now });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
