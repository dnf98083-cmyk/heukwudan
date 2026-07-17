import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요." }, { status: 400 });
  }

  // 슈퍼개발자 체크 (DB 조회 없이 env로만 처리)
  if (
    username === process.env.SUPER_DEV_ID?.trim() &&
    password === process.env.SUPER_DEV_PASSWORD?.trim()
  ) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = "super";
    session.nickname = "슈퍼개발자";
    session.role = "슈퍼개발자";
    session.isLoggedIn = true;
    await session.save();
    return NextResponse.json({ success: true, role: "슈퍼개발자" });
  }

  // 일반 길드원 체크 (Supabase guild_members)
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guild_members")
    .select("id, nickname, role")
    .eq("nickname", username)
    .eq("entry_code", password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "닉네임 또는 코드가 올바르지 않습니다." }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.userId = data.id;
  session.nickname = data.nickname;
  session.role = data.role as SessionData["role"];
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true, role: data.role });
}
