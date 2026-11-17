import { NextResponse } from "next/server";
import { validateAdminCredentials, setAdminSession } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password tidak valid." },
        { status: 401 }
      );
    }

    await setAdminSession(username);

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      redirect: "/admin",
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat autentikasi." },
      { status: 500 }
    );
  }
}
