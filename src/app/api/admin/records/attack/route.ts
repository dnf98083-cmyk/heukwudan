import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLES = ["슈퍼개발자", "관리자"];

export async function DELETE() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn || !ADMIN_ROLES.includes(session.role))
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { error } = await createAdminClient()
    .from("guild_war_records")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
