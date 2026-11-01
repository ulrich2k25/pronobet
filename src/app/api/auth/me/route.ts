import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const token = (await cookies()).get("pb_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string"
    ) {
      return NextResponse.json(
        { authenticated: false },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id,username")
      .eq("id", payload.sub)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: "Erreur de vérification du compte." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json(
        { error: "Erreur de vérification du rôle." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
        },
        isAdmin: Boolean(admin),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
