import { NextResponse } from "next/server";
import { getAllApplications, createApplication } from "@/lib/applications";
import { checkAdminSession } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";
    const status = searchParams.get("status") || "";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const data = await getAllApplications({
      includeDeleted,
      search,
      department,
      status,
    });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/applications]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data aplikasi." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await checkAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.app_name) {
      return NextResponse.json(
        { error: "Nama aplikasi wajib diisi." },
        { status: 400 }
      );
    }

    const created = await createApplication(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/applications]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan aplikasi baru: " + error.message },
      { status: 500 }
    );
  }
}
