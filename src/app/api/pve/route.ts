import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// GET: ?category=siege&content_id=mon[&turn_num=8]
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category   = searchParams.get("category");
  const content_id = searchParams.get("content_id");
  const turn_num   = searchParams.get("turn_num") ?? null;

  if (!category || !content_id) {
    return NextResponse.json({ error: "category, content_id 필요" }, { status: 400 });
  }

  const supabase = await createClient();
  let q = supabase
    .from("pve_strategies")
    .select("*")
    .eq("category", category)
    .eq("content_id", content_id)
    .order("sort_order");

  if (turn_num) q = q.eq("turn_num", turn_num);
  else q = q.is("turn_num", null);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: upsert a build (관리자 이상)
export async function POST(request: NextRequest) {
  const session = await getSession();
  const allowed = ["슈퍼개발자", "관리자", "연구원"];
  if (!session.isLoggedIn || !allowed.includes(session.role ?? "")) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await request.json();
  const { category, content_id, build_key, turn_num = null, build_name, deck, skill_order, equipment, formations, details, sort_order, maker } = body;

  if (!category || !content_id || !build_key) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 기존 레코드 찾기
  let existingQ = admin
    .from("pve_strategies")
    .select("id")
    .eq("category", category)
    .eq("content_id", content_id)
    .eq("build_key", build_key);
  if (turn_num) existingQ = existingQ.eq("turn_num", turn_num);
  else existingQ = existingQ.is("turn_num", null);

  const { data: existing } = await existingQ.maybeSingle();

  const payload = {
    category, content_id, build_key, turn_num: turn_num ?? null,
    build_name: build_name ?? null,
    deck: deck ?? null,
    skill_order: skill_order ?? null,
    equipment: equipment ?? null,
    formations: formations ?? [],
    details: details ?? {},
    sort_order: sort_order ?? 0,
    maker: maker ?? session.nickname ?? null,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    const { data, error } = await admin.from("pve_strategies").update(payload).eq("id", existing.id).select().single();
    result = { data, error };
  } else {
    const { data, error } = await admin.from("pve_strategies").insert(payload).select().single();
    result = { data, error };
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data);
}
