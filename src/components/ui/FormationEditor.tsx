"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { searchHeroes } from "@/lib/hero-search";
import { TYPE_STYLE } from "@/lib/constants";
import type { FormationType, HeroType } from "@/types";

// pos(1-5) → hero name 매핑
export type SlotMap = Record<number, string>;

// 진형 타입별 앞줄/뒷줄 포지션 배치
const LAYOUT: Record<FormationType, { front: number[]; back: number[] }> = {
  기본:   { front: [1, 2],          back: [3, 4, 5] },
  밸런스: { front: [1, 2, 3],       back: [4, 5] },
  공격:   { front: [1],             back: [2, 3, 4, 5] },
  보호:   { front: [1, 2, 3, 4],    back: [5] },
};

const FORMATION_TYPES: FormationType[] = ["기본", "밸런스", "공격", "보호"];

// SlotMap ↔ DB 배열 변환
export function slotsToArray(slots: SlotMap): Array<{ pos: number; name: string }> {
  return Object.entries(slots)
    .filter(([, name]) => name)
    .map(([pos, name]) => ({ pos: Number(pos), name }));
}

export function arrayToSlots(arr: Array<{ pos: number; name: string }> | null): SlotMap {
  const map: SlotMap = {};
  (arr ?? []).forEach(({ pos, name }) => { map[pos] = name; });
  return map;
}

interface Props {
  formationType: FormationType;
  onFormationTypeChange: (type: FormationType) => void;
  slots: SlotMap;
  onSlotsChange: (slots: SlotMap) => void;
  allowedHeroes?: string[];
}

export function FormationEditor({ formationType, onFormationTypeChange, slots, onSlotsChange, allowedHeroes }: Props) {
  const [heroes, setHeroes] = useState<{ id: string; name: string; type: HeroType | null }[]>([]);

  useEffect(() => {
    createClient()
      .from("heroes")
      .select("id, name, type")
      .order("name")
      .then(({ data }) => setHeroes(data ?? []));
  }, []);

  const { front, back } = LAYOUT[formationType];
  const usedNames = Object.values(slots).filter(Boolean);
  const displayHeroes = allowedHeroes
    ? heroes.filter((h) => allowedHeroes.includes(h.name))
    : heroes;

  function setSlot(pos: number, name: string) {
    onSlotsChange({ ...slots, [pos]: name });
  }

  return (
    <div className="space-y-3">
      {/* 앞줄 */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-center text-muted-foreground tracking-widest">▲ 앞줄</p>
        <div
          className="grid gap-2 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${front.length}, 1fr)`,
            maxWidth: front.length === 1 ? "90px" : "100%",
          }}
        >
          {front.map((pos) => (
            <SlotInput
              key={pos}
              pos={pos}
              value={slots[pos] ?? ""}
              heroes={displayHeroes}
              usedNames={usedNames}
              onChange={(name) => setSlot(pos, name)}
            />
          ))}
        </div>
      </div>

      {/* 뒷줄 */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-center text-muted-foreground tracking-widest">▼ 뒷줄</p>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${back.length}, 1fr)` }}
        >
          {back.map((pos) => (
            <SlotInput
              key={pos}
              pos={pos}
              value={slots[pos] ?? ""}
              heroes={displayHeroes}
              usedNames={usedNames}
              onChange={(name) => setSlot(pos, name)}
            />
          ))}
        </div>
      </div>

      {/* 진형 타입 선택 */}
      <div className="pt-1">
        <p className="text-[11px] text-center text-muted-foreground mb-2">공격 진형</p>
        <div className="grid grid-cols-4 gap-1.5">
          {FORMATION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onFormationTypeChange(type)}
              className={cn(
                "rounded-lg py-2 text-xs font-bold border transition-colors",
                formationType === type
                  ? "bg-red-900/40 border-red-500 text-red-300"
                  : "border-border text-muted-foreground hover:bg-accent/30"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 읽기 전용 진형 미리보기 (DeckDialog 상세에서 사용)
// ────────────────────────────────────────────────
export function FormationPreview({
  slots,
  formationType,
}: {
  slots: Array<{ pos: number; name: string }>;
  formationType: FormationType;
}) {
  const slotMap = arrayToSlots(slots);
  const { front, back } = LAYOUT[formationType] ?? LAYOUT["기본"];

  function Row({ positions }: { positions: number[] }) {
    return (
      <div className="flex gap-2 justify-center">
        {positions.map((pos) => (
          <div
            key={pos}
            className="relative rounded-lg border border-red-700/40 bg-red-950/20 w-[62px] h-11 flex items-center justify-center"
          >
            <span className="absolute top-0.5 left-1 text-[9px] text-red-400 font-black">{pos}</span>
            <span className="text-[10px] font-bold text-center px-1 leading-tight break-words">
              {slotMap[pos] || <span className="text-muted-foreground">—</span>}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 rounded-lg bg-muted/10 border border-border p-3">
      <p className="text-[10px] text-center text-muted-foreground">▲ 앞줄</p>
      <Row positions={front} />
      <p className="text-[10px] text-center text-muted-foreground">▼ 뒷줄</p>
      <Row positions={back} />
    </div>
  );
}

// ────────────────────────────────────────────────
// 슬롯 하나 — 영웅 이름 검색 + 선택
// ────────────────────────────────────────────────
function SlotInput({
  pos, value, heroes, usedNames, onChange,
}: {
  pos: number;
  value: string;
  heroes: { id: string; name: string; type: HeroType | null }[];
  usedNames: string[];
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 이미 다른 슬롯에 배치된 영웅은 제외 (현재 슬롯의 영웅은 다시 선택 가능)
  const available = heroes.filter((h) => !usedNames.includes(h.name) || h.name === value);
  const results = query.trim() ? searchHeroes(available, query) : available.slice(0, 8);

  return (
    <div className="relative">
      {/* 슬롯 카드 */}
      <div
        className={cn(
          "rounded-lg border-2 min-h-[68px] flex flex-col items-center justify-center cursor-pointer transition-colors relative pt-1 px-1",
          value
            ? "border-red-700/60 bg-red-950/30 hover:border-red-600"
            : "border-border/40 bg-muted/10 hover:border-border"
        )}
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 40); }}
      >
        {/* 위치 번호 뱃지 */}
        <span className={cn(
          "absolute top-1 left-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black",
          value ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
        )}>
          {pos}
        </span>

        {value ? (
          <>
            <p className="text-[11px] font-bold text-center mt-1 leading-tight px-0.5 break-words max-w-full">{value}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground mt-1">비어있음</p>
        )}
      </div>

      {/* 검색 드롭다운 */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-44 rounded-lg border border-border bg-card shadow-xl">
          <div className="p-1.5">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="영웅 검색..."
              className="h-7 text-xs"
            />
          </div>
          <div className="max-h-44 overflow-y-auto pb-1">
            {results.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-2">없음</p>
            ) : (
              results.map((hero) => {
                const style = hero.type ? TYPE_STYLE[hero.type] : null;
                return (
                  <button
                    key={hero.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange(hero.name); setQuery(""); setOpen(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-accent/50 transition-colors"
                  >
                    <span className="truncate">{hero.name}</span>
                    {style && (
                      <span className={`shrink-0 ml-1 rounded px-1 py-0.5 text-[10px] ${style.className}`}>
                        {style.label}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
