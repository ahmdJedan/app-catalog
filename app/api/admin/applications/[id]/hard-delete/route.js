import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hardDeleteApplication } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id;
  try {
    const result = await hardDeleteApplication(id);
    return NextResponse.json({
      success: true,
      message: "Aplikasi berhasil dihapus secara permanen.",
      data: result,
    });
  } catch (error) {
    console.error(`[DELETE /api/admin/applications/${id}/hard-delete]`, error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus aplikasi secara permanen." },
      { status: 500 }
    );
  }
}
