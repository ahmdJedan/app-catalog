import { NextResponse } from "next/server";
import { getApplicationById } from "@/lib/applications";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const id = resolvedParams?.id;
  try {
    const data = await getApplicationById(id);
    if (!data) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error(`[GET /api/applications/${id}]`, error);
    return NextResponse.json(
      { error: "Unable to load application." },
      { status: 500 }
    );
  }
}
