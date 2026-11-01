import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AdminSession = {
  userId: string;
  username: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  // 1. Récupérer le cookie de connexion.
  const cookieStore = await cookies();
  const token = cookieStore.get("pb_token")?.value;

  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  // 2. Vérifier la session JWT.
  let userId: string;

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      !decoded.sub
    ) {
      return null;
    }

    userId = decoded.sub;
  } catch {
    return null;
  }

  // 3. Vérifier l'autorisation administrateur.
  const { data: admin, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminError) {
    console.error("Admin authorization failed:", adminError.message);

    return null;
  }

  if (!admin) {
    return null;
  }

  // 4. Récupérer le compte utilisateur.
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id,username")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
  };
}
