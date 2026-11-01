import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
  promoCode: z.string().min(1),
});

type RegisteredUser = {
  id: string;
  username: string;
  created_at: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, promoCode } = schema.parse(body);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Configuration serveur manquante." },
        { status: 500 }
      );
    }

    const code = promoCode.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: "Code promo requis." },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Inscription atomique : compte + utilisation du code promo
    const { data, error } = await supabaseAdmin.rpc(
      "register_pronobet_user",
      {
        p_username: username,
        p_password_hash: password_hash,
        p_promo_code: code,
      }
    );

    if (error) {
      if (error.message.includes("INVALID_PROMO_CODE")) {
        return NextResponse.json(
          { error: "Code promo invalide, inactif ou épuisé." },
          { status: 400 }
        );
      }

      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Nom d'utilisateur déjà utilisé." },
          { status: 409 }
        );
      }

      console.error("Erreur inscription PronoBet:", error);

      return NextResponse.json(
        { error: "Impossible de créer le compte." },
        { status: 500 }
      );
    }

    const user = (data as RegisteredUser[] | null)?.[0];

    if (!user) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte." },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      secret,
      { expiresIn: "30d" }
    );

    const res = NextResponse.json(
      { ok: true, user },
      { status: 201 }
    );

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Informations d'inscription invalides." },
        { status: 400 }
      );
    }

    console.error("Erreur inscription:", error);

    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 }
    );
  }
}
