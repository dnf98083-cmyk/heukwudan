import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";
import { redirect } from "next/navigation";
import HeroesClient from "./HeroesClient";

export default async function HeroesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn || session.role === "길드원") {
    redirect("/");
  }

  return <HeroesClient />;
}
