import { NextResponse } from "next/server";
import { checkAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await checkAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session.user });
}
