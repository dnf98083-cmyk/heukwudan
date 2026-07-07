import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions } from "@/lib/session";
import type { SessionData } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import AttackClient from "./AttackClient";

export default async function AttackPage() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("defense_teams")
    .select("id, title")
    .order("display_order");

  return (
    <AttackClient
      initialTeams={teams ?? []}
      playerNickname={session.nickname ?? ""}
    />
  );
}
