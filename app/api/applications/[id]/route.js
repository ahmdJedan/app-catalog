import { NextResponse } from "next/server";
import { getApplicationById, updateApplication, softDeleteApplication } from "@/lib/applications";
import { checkAdminSession } from "@/lib/auth";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const data = await getApplicationById(id);
    if (!data) {
      return NextResponse.json(
        { error: "Aplikasi tidak ditemukan." },
        { status: 404 }
      );
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`[GET /api/applications/${id}]`, error);
    return NextResponse.json(
      { error: "Gagal memuat aplikasi." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const session = await checkAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await updateApplication(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Aplikasi tidak ditemukan untuk diupdate." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(`[PUT /api/applications/${id}]`, error);
    return NextResponse.json(
      { error: "Gagal mengupdate aplikasi: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await checkAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const deleted = await softDeleteApplication(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Aplikasi tidak ditemukan atau sudah di tempat sampah." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Aplikasi dipindahkan ke tempat sampah." });
  } catch (error) {
    console.error(`[DELETE /api/applications/${id}]`, error);
    return NextResponse.json(
      { error: "Gagal menghapus aplikasi: " + error.message },
      { status: 500 }
    );
  }
}
