import { NextResponse } from "next/server";
import { getDistinctDepartments } from "@/lib/applications";

export async function GET() {
  try {
    const data = await getDistinctDepartments();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/departments]", error);
    return NextResponse.json({ data: [] });
  }
}
