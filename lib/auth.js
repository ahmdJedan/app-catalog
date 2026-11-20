import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "dsti_admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecret() {
  return process.env.ADMIN_SECRET || "dsti_default_secret_key_change_in_prod";
}

/**
 * Validasi kredensial login admin.
 */
export function verifyAdminCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "admin";

  return username === expectedUser && password === expectedPass;
}

/**
 * Buat signed session token.
 */
export function createSessionToken(username = "admin") {
  const expiresAt = Date.now() + SESSION_DURATION * 1000;
  const payload = JSON.stringify({ user: username, exp: expiresAt });
  const b64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(b64Payload)
    .digest("base64url");

  return `${b64Payload}.${signature}`;
}

/**
 * Verifikasi signed session token.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [b64Payload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(b64Payload)
    .digest("base64url");

  if (signature !== expectedSig) return false;

  try {
    const data = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return false;
    return data;
  } catch {
    return false;
  }
}

/**
 * Set session cookie ke browser (via Route Handler atau Server Action).
 */
export async function setAdminSession(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

/**
 * Hapus session cookie.
 */
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Cek apakah request saat ini terautentikasi sebagai admin.
 */
export async function checkAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
