import { NextResponse } from "next/server";
import { verifyAdminCredentials, createSessionToken, setAdminSession } from "@/lib/auth";

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

    const isValid = verifyAdminCredentials(username.trim(), password.trim());
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    await setAdminSession(token);

    return NextResponse.json({ success: true, message: "Login berhasil." });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
