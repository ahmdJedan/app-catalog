import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { restoreApplication } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id;
  try {
    const result = await restoreApplication(id);
    return NextResponse.json({
      success: true,
      message: "Aplikasi berhasil dipulihkan dari tempat sampah.",
      data: result,
    });
  } catch (error) {
    console.error(`[POST /api/admin/applications/${id}/restore]`, error);
    return NextResponse.json(
      { error: error.message || "Gagal memulihkan aplikasi." },
      { status: 500 }
    );
  }
}
