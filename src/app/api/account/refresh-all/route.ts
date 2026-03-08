import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

if (!BACKEND_API_URL) {
  console.error("NEXT_PUBLIC_BACKEND_API_URL is not configured");
}

export async function POST(request: Request) {
  try {
    if (!BACKEND_API_URL) {
      return NextResponse.json(
        { error: "Backend API URL is not configured" },
        { status: 500 }
      );
    }

    const backendUrl = `${BACKEND_API_URL}/api/v1/account/refresh-all`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `Backend returned status ${response.status}`,
      }));

      return NextResponse.json(
        { error: errorData.detail || "Backend request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error calling refresh-all endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh account data",
      },
      { status: 500 }
    );
  }
}
