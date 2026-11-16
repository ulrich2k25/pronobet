import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

const noStore = { "Cache-Control": "no-store" };

function unauthenticated() {
  return NextResponse.json({ authenticated: false }, { headers: noStore });
}

export async function GET() {
  const token = (await cookies()).get("pb_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return unauthenticated();

  let userId: string;
  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return unauthenticated();
    }
    userId = payload.sub;
  } catch {
    return unauthenticated();
  }

  try {
    const sql = getDb();
    const [user] = await sql`
      SELECT u.id, u.username,
        EXISTS (
          SELECT 1 FROM public.admin_users AS a WHERE a.user_id = u.id
        ) AS is_admin
      FROM public.users AS u
      WHERE u.id = ${userId}
    `;

    if (!user) return unauthenticated();

    return NextResponse.json(
      {
        authenticated: true,
        user: { id: user.id, username: user.username },
        isAdmin: user.is_admin,
      },
      { headers: noStore }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur de vérification du compte." },
      { status: 500, headers: noStore }
    );
  }
}
