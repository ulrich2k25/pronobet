import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

const schema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { username, password } = parsed.data;

  try {
    const sql = getDb();
    const users = await sql`
      SELECT u.id, u.username, u.password_hash,
        EXISTS (
          SELECT 1 FROM public.admin_users AS a WHERE a.user_id = u.id
        ) AS is_admin
      FROM public.users AS u
      WHERE u.username = ${username}
      LIMIT 2
    `;

    const user = users[0];
    if (users.length !== 1 || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "JWT_SECRET manquant." }, { status: 500 });
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, secret, {
      expiresIn: "30d",
    });

    const res = NextResponse.json({ ok: true, isAdmin: user.is_admin });
    res.cookies.set({
      name: "pb_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch {
    console.error("Erreur de connexion Pronobet.");
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
