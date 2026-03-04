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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, promoCode } = schema.parse(body);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "JWT_SECRET manquant." }, { status: 500 });
    }

    // ✅ Normalisation (évite espaces, auto-correct, majuscules)
    const code = promoCode.trim().toUpperCase();

    // 1) Code promo obligatoire + doit être "BONNUS"
    if (code !== "BONNUS") {
      return NextResponse.json({ error: "Code promo invalide ou requis." }, { status: 400 });
    }

    // 2) Vérifier en DB : existe + actif + pas dépassé
    // ⚠️ Assure-toi que promo_codes.code en DB est stocké en MAJUSCULES (BONNUS)
    const { data: promo, error: promoErr } = await supabaseAdmin
      .from("promo_codes")
      .select("code,is_active,max_uses,uses_count")
      .eq("code", code)
      .maybeSingle();

    if (promoErr || !promo || !promo.is_active) {
      return NextResponse.json({ error: "Code promo invalide ou inactif." }, { status: 400 });
    }

    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return NextResponse.json({ error: "Code promo épuisé." }, { status: 400 });
    }

    // 3) Créer user
    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({ username, password_hash })
      .select("id,username,created_at")
      .single();

    if (userErr) {
      const msg = userErr.message.includes("duplicate key")
        ? "Username déjà utilisé."
        : "Erreur création compte.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 4) Redemption + incrémenter uses_count
    // (si tu veux éviter les doubles incréments en cas d’erreur, on pourra rendre ça transactionnel après)
    await supabaseAdmin.from("promo_redemptions").insert({
      user_id: user.id,
      promo_code: code,
    });

    await supabaseAdmin
      .from("promo_codes")
      .update({ uses_count: promo.uses_count + 1 })
      .eq("code", code);

    // ✅ Auto-login après register (pose cookie pb_token)
    const token = jwt.sign({ sub: user.id, username: user.username }, secret, { expiresIn: "7d" });

    const res = NextResponse.json({ ok: true, user }, { status: 201 });

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set({
      name: "pb_token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd, // ✅ IMPORTANT sur Vercel/HTTPS
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Requête invalide.", details: e?.message }, { status: 400 });
  }
}