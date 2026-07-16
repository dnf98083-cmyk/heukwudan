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

// 역할 또는 코드 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const patch: Record<string, string> = {};

  if (body.role) {
    if (!["관리자", "연구원", "길드원"].includes(body.role)) {
      return NextResponse.json({ error: "올바른 역할을 선택하세요." }, { status: 400 });
    }
    patch.role = body.role;
  }
  if (body.entry_code) {
    if (body.entry_code.length !== 6) {
      return NextResponse.json({ error: "코드는 6자리여야 합니다." }, { status: 400 });
    }
    patch.entry_code = body.entry_code;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("guild_members")
    .update(patch)
    .eq("id", id)
    .select("id, nickname, role, entry_code, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 회원 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { id } = await params;
  const { error } = await createAdminClient()
    .from("guild_members")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
