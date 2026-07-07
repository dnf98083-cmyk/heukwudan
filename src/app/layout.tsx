import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "흑우단 공략",
  description: "세븐나이츠 리버스 흑우단 길드 공략 사이트",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const user = session.isLoggedIn
    ? { nickname: session.nickname, role: session.role }
    : null;

  return (
    <html lang="ko" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar user={user} />
        <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
          흑우단 공략 © 2026
        </footer>
      </body>
    </html>
  );
}
