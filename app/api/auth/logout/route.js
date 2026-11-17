import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({
      success: true,
      message: "Logout berhasil.",
      redirect: "/",
    });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return NextResponse.json(
      { error: "Gagal memproses logout." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await clearAdminSession();
  const homeUrl = new URL("/", request.url);
  return NextResponse.redirect(homeUrl);
}
