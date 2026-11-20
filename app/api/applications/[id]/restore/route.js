import { NextResponse } from "next/server";
import { restoreApplication } from "@/lib/applications";
import { checkAdminSession } from "@/lib/auth";

export async function POST(request, { params }) {
  const session = await checkAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const restored = await restoreApplication(id);
    if (!restored) {
      return NextResponse.json(
        { error: "Aplikasi tidak ditemukan di tempat sampah." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Aplikasi berhasil dipulihkan." });
  } catch (error) {
    console.error(`[POST /api/applications/${id}/restore]`, error);
    return NextResponse.json(
      { error: "Gagal memulihkan aplikasi: " + error.message },
      { status: 500 }
    );
  }
}
