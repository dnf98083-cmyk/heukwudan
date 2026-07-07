"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Swords, BookOpen, User, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/session";

const navItems = [
  { href: "/defense", label: "방어팀 공략", icon: Shield },
  { href: "/records", label: "수비 기록", icon: Swords },
  { href: "/heroes", label: "영웅 도감", icon: BookOpen },
];

const ROLE_BADGE: Record<UserRole, { label: string; className: string } | null> = {
  슈퍼개발자: null, // 슈퍼개발자는 배지 숨김
  관리자: { label: "관리자", className: "bg-amber-500/20 text-amber-400" },
  연구원: { label: "연구원", className: "bg-blue-500/20 text-blue-400" },
  길드원: { label: "길드원", className: "bg-muted text-muted-foreground" },
};

interface NavbarProps {
  user?: { nickname: string; role: UserRole } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold">
          <span className="text-lg">⚔️ 흑우단 공략</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User size={14} />
                {user.nickname}
                {ROLE_BADGE[user.role] && (
                  <span className={`rounded px-1.5 py-0.5 text-xs ${ROLE_BADGE[user.role]!.className}`}>
                    {ROLE_BADGE[user.role]!.label}
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={14} />
                로그아웃
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogIn size={14} />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
