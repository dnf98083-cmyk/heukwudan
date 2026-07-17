import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import RecordsClient from "./RecordsClient";

export default async function RecordsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const isAdmin = ["슈퍼개발자", "관리자"].includes(session.role ?? "");
  return <RecordsClient isAdmin={isAdmin} />;
}
