import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = ["슈퍼개발자", "관리자"];

async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// 전체 조회
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("speed_records")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 저장 (같은 성 + 닉네임 + 적군덱이면 업데이트, 아니면 신규 추가)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  // 같은 성 + 상대 닉네임의 기존 기록 조회
  let q = admin
    .from("speed_records")
    .select("id, enemy_heroes")
    .eq("castle_type", body.castle_type);
  q = body.opponent_name
    ? q.eq("opponent_name", body.opponent_name)
    : q.is("opponent_name", null);
  const { data: candidates } = await q;

  // 적군덱 일치 여부 확인 (순서 무관 비교)
  const sortedNew = [...(body.enemy_heroes as string[])].sort().join(",");
  const existing = candidates?.find(
    (r) => [...(r.enemy_heroes as string[])].sort().join(",") === sortedNew
  );

  let data, error;
  if (existing) {
    ({ data, error } = await admin
      .from("speed_records")
      .update({ ...body, recorded_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single());
  } else {
    ({ data, error } = await admin
      .from("speed_records")
      .insert(body)
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 전체 초기화 (관리자)
export async function DELETE() {
  const session = await getSession();
  if (!session.isLoggedIn || !ADMIN_ROLES.includes(session.role))
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { error } = await createAdminClient().from("speed_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
