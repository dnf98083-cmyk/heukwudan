import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import GuildWarClient from "./GuildWarClient";

export default async function GuildWarPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const isAdmin = ["슈퍼개발자", "관리자"].includes(session.role ?? "");
  return <GuildWarClient isAdmin={isAdmin} />;
}
