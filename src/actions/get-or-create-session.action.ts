"use server";

import { cookies } from "next/headers";

export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session_id")?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("cart_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return sessionId;
}
