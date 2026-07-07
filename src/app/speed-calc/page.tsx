"use client";

import { useState } from "react";
import { Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { HeroType, SpeedSlot } from "@/types";

// v1에서 그대로 가져온 타입별 기본 속공값
const SPEED_BASE: Record<HeroType, number> = {
  방어형: 19,
  지원형: 19,
  만능형: 25,
  마법형: 29,
  공격형: 29,
};

const HERO_TYPES: HeroType[] = ["방어형", "지원형", "만능형", "마법형", "공격형"];

const DEFAULT_SLOTS: SpeedSlot[] = Array.from({ length: 6 }, () => ({
  team: "",
  name: "",
  speed: 0,
  type: "만능형",
}));

export default function SpeedCalcPage() {
  const [result, setResult] = useState<"win" | "lose">("win");
  const [slots, setSlots] = useState<SpeedSlot[]>(DEFAULT_SLOTS);
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyze> | null>(null);

  function updateSlot(idx: number, patch: Partial<SpeedSlot>) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function reset() {
    setSlots(DEFAULT_SLOTS.map((s) => ({ ...s })));
    setAnalysisResult(null);
    setResult("win");
  }

  function handleAnalyze() {
    const out = analyze(slots, result);
    if (out.error) { alert(out.error); return; }
    setAnalysisResult(out);
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap size={22} />
          속공 계산기
        </h1>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw size={13} />
          초기화
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        리플레이를 보고 순서대로 아군/적군을 선택하면 적군 속공을 추측합니다.
      </p>

      {/* 속공 승패 */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">⚖️ 속공 승패</p>
        <div className="grid grid-cols-2 gap-2">
          {(["win", "lose"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setResult(v)}
              className={cn(
                "py-2.5 rounded-lg text-sm font-bold border transition-colors",
                result === v
                  ? v === "win"
                    ? "bg-green-600/20 border-green-600 text-green-400"
                    : "bg-red-600/20 border-red-600 text-red-400"
                  : "border-border text-muted-foreground hover:bg-accent/30"
              )}
            >
              {v === "win" ? "✅ 속공승" : "❌ 속공패"}
            </button>
          ))}
        </div>
      </div>

      {/* 리플레이 순서 슬롯 */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">🎬 리플레이 순서</p>
        <div className="space-y-2">
          {slots.map((slot, idx) => (
            <SlotRow
              key={idx}
              idx={idx}
              slot={slot}
              onChange={(patch) => updateSlot(idx, patch)}
            />
          ))}
        </div>
      </div>

      {/* 분석 버튼 */}
      <button
        onClick={handleAnalyze}
        className="w-full py-3.5 rounded-lg font-black text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
      >
        ⚡ 속공 추측하기
      </button>

      {/* 결과 */}
      {analysisResult && <AnalysisResult data={analysisResult} speedResult={result} />}
    </div>
  );
}

function SlotRow({
  idx,
  slot,
  onChange,
}: {
  idx: number;
  slot: SpeedSlot;
  onChange: (p: Partial<SpeedSlot>) => void;
}) {
  return (
    <div className="rounded-lg bg-accent/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-black shrink-0">
          {idx + 1}
        </div>
        <select
          value={slot.team}
          onChange={(e) => onChange({ team: e.target.value as SpeedSlot["team"], name: "", speed: 0, type: "만능형" })}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">선택</option>
          <option value="ally">🔵 아군</option>
          <option value="enemy">🔴 적군</option>
        </select>
      </div>

      {slot.team === "ally" && (
        <div className="flex gap-2 pl-9">
          <Input
            placeholder="이름"
            value={slot.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="flex-1 text-sm"
          />
          <Input
            type="number"
            placeholder="속공"
            value={slot.speed || ""}
            onChange={(e) => onChange({ speed: parseInt(e.target.value) || 0 })}
            className="w-20 text-sm"
          />
        </div>
      )}

      {slot.team === "enemy" && (
        <div className="flex gap-2 pl-9">
          <Input
            placeholder="이름"
            value={slot.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="flex-1 text-sm"
          />
          <select
            value={slot.type}
            onChange={(e) => onChange({ type: e.target.value as HeroType })}
            className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            {HERO_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────
// 분석 로직 (v1 analyzeSpeed 이식)
// ──────────────────────────────────────
interface EnemyResult {
  name: string;
  type: HeroType;
  baseSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  minBonus: number;
  maxBonus: number;
  order: number;
}

interface AnalysisOutput {
  error?: string;
  allyTotal?: number;
  enemyMinTotal?: number;
  enemyMaxTotal?: number;
  enemies?: EnemyResult[];
}

function analyze(slots: SpeedSlot[], speedResult: "win" | "lose"): AnalysisOutput {
  const chars = slots.filter((s) => s.team !== "");
  if (chars.length === 0) return { error: "캐릭터를 선택하세요." };

  const allyChars = chars.filter((c) => c.team === "ally");
  if (allyChars.length === 0) return { error: "아군을 최소 1명 선택하세요." };
  for (const c of allyChars) {
    if (!c.speed) return { error: "아군 속공을 모두 입력하세요." };
  }

  const allyTotal = allyChars.reduce((s, c) => s + c.speed, 0);
  const results: EnemyResult[] = [];

  chars.forEach((char, i) => {
    if (char.team !== "enemy") return;

    const baseSpeed = SPEED_BASE[char.type];
    const prev = i > 0 ? chars[i - 1] : null;
    const next = i < chars.length - 1 ? chars[i + 1] : null;

    let minSpeed = baseSpeed;
    let maxSpeed = baseSpeed + 100;

    if (next?.team === "ally") minSpeed = Math.max(minSpeed, next.speed + 1);
    if (prev?.team === "ally") maxSpeed = Math.min(maxSpeed, prev.speed - 1);
    if (minSpeed > maxSpeed) { minSpeed = baseSpeed; maxSpeed = baseSpeed; }

    results.push({
      name: char.name || "이름 없음",
      type: char.type,
      baseSpeed,
      minSpeed,
      maxSpeed,
      minBonus: Math.max(0, minSpeed - baseSpeed),
      maxBonus: maxSpeed - baseSpeed,
      order: slots.indexOf(char) + 1,
    });
  });

  let enemyMinTotal = results.reduce((s, r) => s + r.minSpeed, 0);
  let enemyMaxTotal = results.reduce((s, r) => s + r.maxSpeed, 0);

  if (speedResult === "win") enemyMaxTotal = Math.min(enemyMaxTotal, allyTotal - 1);
  else enemyMinTotal = Math.max(enemyMinTotal, allyTotal + 1);

  return { allyTotal, enemyMinTotal, enemyMaxTotal, enemies: results };
}

function AnalysisResult({
  data,
  speedResult,
}: {
  data: AnalysisOutput;
  speedResult: "win" | "lose";
}) {
  if (!data.allyTotal) return null;

  return (
    <div className="space-y-3">
      {/* 합산 비교 */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <p className="text-sm font-semibold">⚖️ 합산 속공 비교</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
            <p className="text-xs text-blue-400 font-semibold mb-1">🔵 아군 합산</p>
            <p className="text-2xl font-black text-blue-400">{data.allyTotal}</p>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
            <p className="text-xs text-red-400 font-semibold mb-1">🔴 적군 합산 (추정)</p>
            <p className="text-xl font-black text-red-400">
              {data.enemyMinTotal} ~ {data.enemyMaxTotal}
            </p>
          </div>
        </div>
        <div className={cn(
          "rounded-lg p-3 text-center text-sm font-bold",
          speedResult === "win"
            ? "bg-green-600/10 border border-green-600/20 text-green-400"
            : "bg-red-600/10 border border-red-600/20 text-red-400"
        )}>
          {speedResult === "win" ? "✅ 속공승 (아군이 빠름)" : "❌ 속공패 (적군이 빠름)"}
        </div>
      </div>

      {/* 적군 개별 추측 */}
      {data.enemies && data.enemies.length > 0 && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-semibold">🎯 추측된 적군 속공</p>
          <div className="space-y-2">
            {data.enemies.map((r, i) => (
              <div key={i} className="rounded-lg bg-red-500/8 border border-red-500/20 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.type} (기본 {r.baseSpeed}) · {r.order}번째
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">추정 속공</p>
                    <p className="text-lg font-black text-red-400">
                      {r.minSpeed} ~ {r.maxSpeed}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  보너스: +{r.minBonus} ~ +{r.maxBonus}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
