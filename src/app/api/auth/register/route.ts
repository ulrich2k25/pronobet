import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
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

    // 1) Code promo obligatoire + doit être "Bonnus"
    if (promoCode !== "Bonnus") {
      return NextResponse.json(
        { error: "Code promo invalide ou requis." },
        { status: 400 }
      );
    }

    // 2) Vérifier que le code existe en DB + actif + pas dépassé
    const { data: promo, error: promoErr } = await supabaseAdmin
      .from("promo_codes")
      .select("code,is_active,max_uses,uses_count")
      .eq("code", promoCode)
      .maybeSingle();

    if (promoErr || !promo || !promo.is_active) {
      return NextResponse.json(
        { error: "Code promo invalide ou inactif." },
        { status: 400 }
      );
    }

    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return NextResponse.json(
        { error: "Code promo épuisé." },
        { status: 400 }
      );
    }

    // 3) Créer user
    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({ username, password_hash })
      .select("id,username,created_at")
      .single();

    if (userErr) {
      const msg =
        userErr.message.includes("duplicate key") ? "Username déjà utilisé." : "Erreur création compte.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 4) Enregistrer redemption + incrémenter uses_count
    await supabaseAdmin.from("promo_redemptions").insert({
      user_id: user.id,
      promo_code: promoCode,
    });

    await supabaseAdmin
      .from("promo_codes")
      .update({ uses_count: promo.uses_count + 1 })
      .eq("code", promoCode);

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Requête invalide.", details: e?.message },
      { status: 400 }
    );
  }
}
