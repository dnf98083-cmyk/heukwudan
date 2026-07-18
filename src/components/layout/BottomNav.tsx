"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Shield, Calendar, Castle, Menu, X,
  Swords, Zap, Trophy, BookOpen, Users, LogOut, LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/session";

const MAIN_ITEMS = [
  { href: "/",          label: "홈",     icon: Home,     exact: true },
  { href: "/defense",   label: "방어팀", icon: Shield },
  { href: "/guild-war", label: "길드전", icon: Calendar },
  { href: "/pve",       label: "PVE",    icon: Castle },
];

const ROLE_LEVEL: Record<UserRole, number> = {
  길드원: 1, 연구원: 2, 관리자: 3, 슈퍼개발자: 4,
};

interface BottomNavProps {
  user?: { nickname: string; role: UserRole } | null;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
    setOpen(false);
  }

  const moreItems = [
    { href: "/attack",     label: "길드전 공격",   icon: Swords },
    { href: "/speed-calc", label: "속공 계산기",   icon: Zap },
    { href: "/records",    label: "랭킹",          icon: Trophy },
    ...(user && ROLE_LEVEL[user.role] >= ROLE_LEVEL["연구원"]
      ? [{ href: "/heroes", label: "영웅 도감", icon: BookOpen }] : []),
    ...(user && ROLE_LEVEL[user.role] >= ROLE_LEVEL["관리자"]
      ? [{ href: "/admin", label: "회원관리", icon: Users }] : []),
  ];

  return (
    <>
      {/* 더보기 시트 */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-14 left-0 right-0 bg-background border-t border-border/50 rounded-t-2xl px-4 pt-4 pb-5 space-y-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">
                {user ? `${user.nickname}` : "메뉴"}
              </p>
              <button onClick={() => setOpen(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {moreItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/30"
                )}
              >
                <Icon size={17} className="text-muted-foreground" />
                {label}
              </Link>
            ))}

            <div className="pt-2 mt-1 border-t border-border/30">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
                >
                  <LogOut size={17} />로그아웃
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
                >
                  <LogIn size={17} />로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
        <div className="flex h-14">
          {MAIN_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors select-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors select-none",
              open ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu size={20} strokeWidth={open ? 2.5 : 1.8} />
            <span>더보기</span>
          </button>
        </div>
      </nav>
    </>
  );
}
