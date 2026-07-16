import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLES = ["슈퍼개발자", "관리자"];

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn || !ADMIN_ROLES.includes(session.role)) return null;
  return session;
}

// 목록 조회
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { data, error } = await createAdminClient()
    .from("guild_members")
    .select("id, nickname, role, entry_code, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 회원 추가
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { nickname, entry_code, role } = await request.json();

  if (!nickname?.trim() || !entry_code?.trim()) {
    return NextResponse.json({ error: "닉네임과 코드를 입력하세요." }, { status: 400 });
  }
  if (entry_code.length !== 6) {
    return NextResponse.json({ error: "코드는 6자리여야 합니다." }, { status: 400 });
  }
  if (!["관리자", "연구원", "길드원"].includes(role)) {
    return NextResponse.json({ error: "올바른 역할을 선택하세요." }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("guild_members")
    .insert({ nickname: nickname.trim(), entry_code: entry_code.trim(), role })
    .select("id, nickname, role, entry_code, created_at")
    .single();

  if (error) {
    const msg = error.code === "23505" ? "이미 존재하는 닉네임입니다." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
