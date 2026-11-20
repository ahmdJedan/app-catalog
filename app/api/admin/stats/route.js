import { NextResponse } from "next/server";
import { getApplicationStats } from "@/lib/applications";

export async function GET() {
  try {
    const stats = await getApplicationStats();
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik." },
      { status: 500 }
    );
  }
}
