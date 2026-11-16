import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

export type AdminSession = {
  userId: string;
  username: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get("pb_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === "string" || typeof payload.sub !== "string" || !payload.sub) {
      return null;
    }

    const sql = getDb();
    const [user] = await sql`
      SELECT u.id, u.username
      FROM public.users AS u
      WHERE u.id = ${payload.sub}
        AND EXISTS (
          SELECT 1 FROM public.admin_users AS a WHERE a.user_id = u.id
        )
    `;

    return user ? { userId: user.id, username: user.username } : null;
  } catch {
    return null;
  }
}
