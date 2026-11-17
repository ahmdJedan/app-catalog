import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createApplication } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    if (!data.app_name || !String(data.app_name).trim()) {
      return NextResponse.json(
        { error: "Nama aplikasi (app_name) wajib diisi." },
        { status: 400 }
      );
    }

    const result = await createApplication(data);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/applications]", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat aplikasi baru." },
      { status: 500 }
    );
  }
}
