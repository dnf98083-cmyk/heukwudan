"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/session";

interface Member {
  id: string;
  nickname: string;
  role: "관리자" | "연구원" | "길드원";
  entry_code: string;
  created_at: string;
}

const ROLES: Member["role"][] = ["관리자", "연구원", "길드원"];

const ROLE_STYLE: Record<Member["role"], string> = {
  관리자: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  연구원: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  길드원: "bg-muted text-muted-foreground border-border",
};

// ─── 추가 다이얼로그 ────────────────────────────────
function AddDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (m: Member) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [role, setRole] = useState<Member["role"]>("길드원");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() { setNickname(""); setEntryCode(""); setRole("길드원"); setError(""); }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, entry_code: entryCode, role }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    onAdded(json);
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <h2 className="text-base font-bold flex items-center gap-2 mb-4">
          <Plus size={16} />회원 추가
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">닉네임</label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="게임 닉네임" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">입장 코드 (6자리)</label>
            <Input
              value={entryCode}
              onChange={(e) => setEntryCode(e.target.value.slice(0, 6))}
              placeholder="예: A1B2C3"
              maxLength={6}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">역할</label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                    role === r ? ROLE_STYLE[r] : "border-border text-muted-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { reset(); onClose(); }}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent/30 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !nickname.trim() || entryCode.length !== 6}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "추가 중..." : "추가"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 코드 변경 다이얼로그 ───────────────────────────
function CodeDialog({
  member,
  onClose,
  onUpdated,
}: {
  member: Member | null;
  onClose: () => void;
  onUpdated: (m: Member) => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (member) setCode(""); setError(""); }, [member]);

  async function handleSubmit() {
    if (!member) return;
    setError(""); setLoading(true);
    const res = await fetch(`/api/admin/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_code: code }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error); return; }
    onUpdated(json);
    onClose();
  }

  return (
    <Dialog open={!!member} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <h2 className="text-base font-bold flex items-center gap-2 mb-4">
          <KeyRound size={16} />{member?.nickname} 코드 변경
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">새 입장 코드 (6자리)</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              placeholder="새 코드 입력"
              maxLength={6}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent/30 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || code.length !== 6}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "변경 중..." : "변경"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 ──────────────────────────────────────────
export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [codeTarget, setCodeTarget] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchMembers() {
    setLoading(true);
    const res = await fetch("/api/admin/members");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchMembers(); }, []);

  async function handleRoleChange(id: string, role: Member["role"]) {
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={22} />
          회원 관리
        </h1>
        <div className="flex gap-2">
          <button
            onClick={fetchMembers}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />회원 추가
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400 flex items-start gap-2">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        <span>
          입장 코드는 회원에게 직접 전달하세요. 코드를 잃어버린 경우 이 페이지에서 재발급 가능합니다.
          슈퍼개발자 계정은 .env.local에서만 관리합니다.
        </span>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-12">불러오는 중...</p>
      ) : members.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">등록된 회원이 없습니다.</p>
      ) : (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-sm font-semibold text-muted-foreground">총 {members.length}명</p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-border/40 bg-muted/10 px-4 py-3 flex items-start gap-3"
              >
                {/* 닉네임 + 코드 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{m.nickname}</p>
                    <Badge variant="outline" className={cn("text-xs border", ROLE_STYLE[m.role])}>
                      {m.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    코드: <span className="font-mono text-foreground">{m.entry_code}</span>
                    &nbsp;·&nbsp;
                    {new Date(m.created_at).toLocaleDateString("ko-KR")} 가입
                  </p>
                </div>

                {/* 역할 변경 */}
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value as Member["role"])}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>

                {/* 코드 재발급 */}
                <button
                  onClick={() => setCodeTarget(m)}
                  title="코드 변경"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
                >
                  <KeyRound size={14} />
                </button>

                {/* 삭제 */}
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  title="삭제"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(m) => setMembers((prev) => [m, ...prev])}
      />
      <CodeDialog
        member={codeTarget}
        onClose={() => setCodeTarget(null)}
        onUpdated={(m) => setMembers((prev) => prev.map((x) => (x.id === m.id ? m : x)))}
      />
    </div>
  );
}
