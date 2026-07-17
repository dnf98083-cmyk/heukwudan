import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { redirect } from "next/navigation";
import PveClient from "./PveClient";

export default async function PvePage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn) redirect("/login");

  const isAdmin = session.role === "슈퍼개발자" || session.role === "관리자" || session.role === "연구원";

  return <PveClient isAdmin={isAdmin} />;
}
