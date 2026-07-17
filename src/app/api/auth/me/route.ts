import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ isLoggedIn: false });
  return NextResponse.json({
    isLoggedIn: true,
    nickname: session.nickname,
    role: session.role,
  });
}
