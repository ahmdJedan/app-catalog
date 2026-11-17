import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateApplication, softDeleteApplication } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id;
  try {
    const data = await request.json();
    const result = await updateApplication(id, data);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`[PUT /api/admin/applications/${id}]`, error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui aplikasi." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id;
  try {
    const result = await softDeleteApplication(id);
    return NextResponse.json({
      success: true,
      message: "Aplikasi berhasil dipindahkan ke tempat sampah (soft delete).",
      data: result,
    });
  } catch (error) {
    console.error(`[DELETE /api/admin/applications/${id}]`, error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses soft delete aplikasi." },
      { status: 500 }
    );
  }
}
