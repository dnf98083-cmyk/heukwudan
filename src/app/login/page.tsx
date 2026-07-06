"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: Supabase 연동 후 실제 인증 처리
    if (!nickname || !code) {
      setError("닉네임과 입장코드를 입력하세요.");
      setLoading(false);
      return;
    }

    // 임시 — 실제 구현에서 API 호출로 교체
    await new Promise((r) => setTimeout(r, 500));
    setError("아직 인증 시스템이 연결되지 않았습니다.");
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn size={18} />
            흑우단 로그인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">닉네임</label>
              <Input
                placeholder="인게임 닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">입장코드</label>
              <Input
                type="password"
                placeholder="6자리 코드"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "확인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
