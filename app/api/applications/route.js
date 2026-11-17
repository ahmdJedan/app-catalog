import { NextResponse } from "next/server";
import { getAllApplications } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getAllApplications();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/applications]", error);
    return NextResponse.json(
      { error: "Unable to load applications." },
      { status: 500 }
    );
  }
}
