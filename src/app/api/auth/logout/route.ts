import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Supprime le cookie d'auth
  res.cookies.set({
    name: "pb_token",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}
