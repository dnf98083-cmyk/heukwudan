import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// 팀별 방어 기록 조회
export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("team_id");
  const supabase = await createClient();
  let q = supabase
    .from("defense_records")
    .select("id, team_id, player_name, defender_name, result, opponent_heroes, memo, recorded_at")
    .order("recorded_at", { ascending: false });
  if (teamId) q = q.eq("team_id", teamId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 방어 기록 추가
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await request.json();
  const { team_id, opponent_heroes, result, memo, defender_name } = body;
  if (!team_id || !result) return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from("defense_records")
    .insert({
      team_id,
      opponent_heroes: opponent_heroes ?? [],
      result,
      memo: memo || null,
      defender_name: defender_name || null,
      player_name: session.nickname ?? "알 수 없음",
      season: 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// 특정 상대덱 그룹 전체 삭제
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const body = await request.json();
  const { team_id, opponent_heroes } = body;
  if (!team_id) return NextResponse.json({ error: "team_id 필요" }, { status: 400 });

  const admin = createAdminClient();
  const { data: all } = await admin
    .from("defense_records")
    .select("id, opponent_heroes")
    .eq("team_id", team_id);

  const sortedTarget = [...(opponent_heroes ?? [])].sort().join(",");
  const ids = (all ?? [])
    .filter((r) => [...(r.opponent_heroes ?? [])].sort().join(",") === sortedTarget)
    .map((r) => r.id);

  if (ids.length === 0) return NextResponse.json({ deleted: 0 });

  const { error } = await admin.from("defense_records").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: ids.length });
}
