import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = schema.parse(body);

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id,username,password_hash")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET!;
    if (!secret) {
      return NextResponse.json({ error: "JWT_SECRET manquant." }, { status: 500 });
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      secret,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({ ok: true }, { status: 200 });

    // Cookie sécurisé (httpOnly)
    res.cookies.set({
      name: "pb_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: false, // en prod => true (https)
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: "Requête invalide.", details: e?.message },
      { status: 400 }
    );
  }
}
