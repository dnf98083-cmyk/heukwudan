"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Swords, BookOpen, User, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/defense", label: "방어팀 공략", icon: Shield },
  { href: "/records", label: "수비 기록", icon: Swords },
  { href: "/heroes", label: "영웅 도감", icon: BookOpen },
];

interface NavbarProps {
  user?: { nickname: string; role: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2 font-bold text-primary">
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
                {user.role === "관리자" && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                    관리자
                  </span>
                )}
              </span>
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut size={14} />
                  로그아웃
                </Button>
              </form>
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
