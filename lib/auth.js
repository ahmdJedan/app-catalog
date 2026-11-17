import { cookies } from "next/headers";

const SESSION_COOKIE = "admin_session";

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return { username, password };
}

export function validateAdminCredentials(username, password) {
  const admin = getAdminCredentials();
  return (
    String(username).trim() === admin.username &&
    String(password) === admin.password
  );
}

async function getCookieStore() {
  const store = cookies();
  return typeof store?.then === "function" ? await store : store;
}

export async function setAdminSession(username) {
  const cookieStore = await getCookieStore();
  const token = Buffer.from(
    JSON.stringify({
      user: username,
      role: "admin",
      createdAt: Date.now(),
    })
  ).toString("base64");

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 jam
  });
}

export async function clearAdminSession() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await getCookieStore();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const data = JSON.parse(raw);
    if (data.role === "admin") return data;
  } catch {
    return null;
  }
  return null;
}
