"use client";

import { useState, useEffect, useCallback } from "react";
import { Castle, ChevronLeft, Plus, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormationEditor, FormationPreview, arrayToSlots, slotsToArray } from "@/components/ui/FormationEditor";
import type { SlotMap } from "@/components/ui/FormationEditor";
import type { FormationType } from "@/types";

// ── 콘텐츠 정의 ─────────────────────────────────────────────────
type ContentType = "build" | "turn_build";

interface ContentItem {
  id: string;
  name: string;
  type?: ContentType;
  fire?: boolean;
  children?: string; // sub-category key
}

const PVE_CONTENT: Record<string, ContentItem[]> = {
  siege: [
    { id: "mon", name: "월요일" }, { id: "tue", name: "화요일" },
    { id: "wed", name: "수요일" }, { id: "thu", name: "목요일" },
    { id: "fri", name: "금요일" }, { id: "sat", name: "토요일" },
    { id: "sun", name: "일요일" },
  ],
  advent: [
    { id: "destruct1", name: "🔥 파괴신 1라", type: "turn_build", fire: true },
    { id: "destruct2", name: "🔥 파괴신 2라", type: "turn_build", fire: true },
    { id: "teo", name: "태오" }, { id: "kyle", name: "카일" },
    { id: "yeonhee", name: "연희" }, { id: "karma", name: "카르마" },
  ],
  raid: [
    { id: "normal_raid", name: "일반 레이드", children: "normal_raid" },
    { id: "event_raid", name: "돌발 레이드", children: "event_raid" },
  ],
  normal_raid: [
    { id: "eye_of_doom", name: "파멸의 눈동자" },
    { id: "umawang", name: "우마왕" },
    { id: "iron_predator", name: "강철의 포식자" },
  ],
  event_raid: [
    { id: "leonid", name: "레오니드" },
    { id: "astraea", name: "아스트레이아" },
    { id: "callistra", name: "칼리스트라" },
  ],
};

const TURN_OPTIONS = ["4", "8", "12", "16", "20", "24"];
const BUILD_KEYS = ["build1", "build2", "build3", "build4"] as const;
type BuildKey = typeof BUILD_KEYS[number];

// ── 타입 ─────────────────────────────────────────────────────────
interface PveFormation {
  type: FormationType;
  slots: Record<number, string>;
}

interface PveDetail {
  name: string;
  deck: string;
  skill_order: string;
  equipment: string;
  formations: PveFormation[];
}

interface PveBuildRecord {
  id: string;
  category: string;
  content_id: string;
  build_key: BuildKey;
  turn_num: string | null;
  build_name: string | null;
  deck: string | null;
  skill_order: string | null;
  equipment: string | null;
  formations: PveFormation[];
  details: Record<string, PveDetail>;
  sort_order: number;
  maker: string | null;
}

// ── 진형 편집 컴포넌트 (단건) ────────────────────────────────────
const FormationTypes: FormationType[] = ["기본", "밸런스", "공격", "보호"];

function PveFormationItem({
  formation, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  formation: PveFormation;
  index: number; total: number;
  onChange: (f: PveFormation) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const slots = arrayToSlots(
    Object.entries(formation.slots).map(([pos, name]) => ({ pos: Number(pos), name }))
  );

  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {FormationTypes.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...formation, type: t })}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                formation.type === t
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-border text-muted-foreground hover:bg-accent/20"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {index > 0 && (
            <button onClick={onMoveUp} className="text-[10px] text-muted-foreground hover:text-foreground px-1">↑</button>
          )}
          {index < total - 1 && (
            <button onClick={onMoveDown} className="text-[10px] text-muted-foreground hover:text-foreground px-1">↓</button>
          )}
          <button onClick={onDelete} className="text-muted-foreground hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <FormationEditor
        slots={slots}
        formationType={formation.type}
        onFormationTypeChange={(t) => onChange({ ...formation, type: t })}
        onSlotsChange={(newSlots) => onChange({ ...formation, slots: slotsToArray(newSlots).reduce<Record<number, string>>((acc, s) => { acc[s.pos] = s.name; return acc; }, {}) })}
      />
    </div>
  );
}

// ── 빌드 편집 패널 ───────────────────────────────────────────────
function BuildEditPanel({
  buildData, currentDetail, isAdmin,
  onSave, onCancel, onDetailChange,
}: {
  buildData: PveBuildRecord | null;
  currentDetail: string;
  isAdmin: boolean;
  onSave: (updated: Partial<PveBuildRecord>) => void;
  onCancel: () => void;
  onDetailChange: (key: string) => void;
}) {
  const base = buildData ?? {} as Partial<PveBuildRecord>;
  const details = (base.details ?? {}) as Record<string, PveDetail>;
  const activeData: Partial<PveDetail | PveBuildRecord> = currentDetail && details[currentDetail]
    ? details[currentDetail] : base;

  const [buildName, setBuildName]     = useState(base.build_name ?? "");
  const [deck, setDeck]               = useState((activeData as PveBuildRecord).deck ?? "");
  const [skillOrder, setSkillOrder]   = useState((activeData as PveBuildRecord).skill_order ?? "");
  const [equipment, setEquipment]     = useState((activeData as PveBuildRecord).equipment ?? "");
  const [formations, setFormations]   = useState<PveFormation[]>((activeData as PveBuildRecord).formations ?? []);
  const [detailName, setDetailName]   = useState(currentDetail ? details[currentDetail]?.name ?? "" : "");
  const [newDetailInput, setNewDetailInput] = useState("");
  const [localDetails, setLocalDetails] = useState<Record<string, PveDetail>>(details);

  // sync when detail switches
  useEffect(() => {
    const d = currentDetail && localDetails[currentDetail] ? localDetails[currentDetail] : base;
    setDeck((d as PveBuildRecord).deck ?? "");
    setSkillOrder((d as PveBuildRecord).skill_order ?? "");
    setEquipment((d as PveBuildRecord).equipment ?? "");
    setFormations((d as PveBuildRecord).formations ?? []);
    setDetailName(currentDetail ? localDetails[currentDetail]?.name ?? "" : "");
  }, [currentDetail]);

  function addDetail() {
    if (!newDetailInput.trim()) return;
    const key = `detail_${Date.now()}`;
    const updated = { ...localDetails, [key]: { name: newDetailInput.trim(), deck: "", skill_order: "", equipment: "", formations: [] } };
    setLocalDetails(updated);
    setNewDetailInput("");
    onDetailChange(key);
  }

  function deleteDetail(key: string) {
    if (!confirm("이 세부사항을 삭제할까요?")) return;
    const updated = { ...localDetails };
    delete updated[key];
    setLocalDetails(updated);
    if (currentDetail === key) onDetailChange("");
  }

  function addFormation() {
    setFormations((prev) => [...prev, { type: "기본", slots: {} }]);
  }

  function updateFormation(i: number, f: PveFormation) {
    setFormations((prev) => prev.map((x, idx) => idx === i ? f : x));
  }

  function deleteFormation(i: number) {
    setFormations((prev) => prev.filter((_, idx) => idx !== i));
  }

  function moveFormation(i: number, dir: -1 | 1) {
    setFormations((prev) => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  function handleSave() {
    // Merge current editing into localDetails / base
    const currentPayload = { deck, skill_order: skillOrder, equipment, formations };
    let updatedDetails = { ...localDetails };

    if (currentDetail) {
      updatedDetails[currentDetail] = { ...updatedDetails[currentDetail], name: detailName, ...currentPayload };
    }

    const finalPayload: Partial<PveBuildRecord> = currentDetail
      ? { build_name: buildName, details: updatedDetails }
      : { build_name: buildName, ...currentPayload, details: updatedDetails };

    onSave(finalPayload);
  }

  const TEXTAREA_CLS = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground";

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-border/40">
      {/* 빌드 이름 */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">빌드 이름</label>
        <Input value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="예: 딜링 빌드, 탱커 빌드..." />
      </div>

      {/* 세부사항 관리 */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-2">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">세부사항 관리</p>
        <div className="flex gap-2">
          <Input
            value={newDetailInput}
            onChange={(e) => setNewDetailInput(e.target.value)}
            placeholder="세부사항 이름 (예: 카일 있음, 속공용)"
            onKeyDown={(e) => e.key === "Enter" && addDetail()}
            className="flex-1 text-xs"
          />
          <Button size="sm" onClick={addDetail} className="shrink-0 text-xs">등록</Button>
        </div>
        {/* 세부사항 목록 */}
        <div className="space-y-1">
          {/* 기본 */}
          <div className={cn(
            "flex items-center justify-between px-2 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors",
            !currentDetail ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-border text-muted-foreground hover:bg-accent/20"
          )} onClick={() => onDetailChange("")}>
            <span>기본</span>
          </div>
          {Object.entries(localDetails).map(([key, val]) => (
            <div key={key} className={cn(
              "flex items-center justify-between px-2 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors",
              currentDetail === key ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-border text-muted-foreground hover:bg-accent/20"
            )}>
              {currentDetail === key ? (
                <Input value={detailName} onChange={(e) => setDetailName(e.target.value)} className="h-5 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 flex-1 text-blue-300" />
              ) : (
                <span onClick={() => onDetailChange(key)} className="flex-1">{val.name}</span>
              )}
              <button onClick={() => deleteDetail(key)} className="ml-2 text-muted-foreground hover:text-red-400"><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* 진형 */}
      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">진형</label>
        {formations.map((f, i) => (
          <PveFormationItem
            key={i} formation={f} index={i} total={formations.length}
            onChange={(nf) => updateFormation(i, nf)}
            onDelete={() => deleteFormation(i)}
            onMoveUp={() => moveFormation(i, -1)}
            onMoveDown={() => moveFormation(i, 1)}
          />
        ))}
        <button
          onClick={addFormation}
          className="w-full py-2 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:border-blue-500/50 hover:text-blue-400 transition-colors"
        >
          <Plus size={11} className="inline mr-1" />진형 추가
        </button>
      </div>

      {/* 덱 조합 */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">덱 조합</label>
        <textarea className={TEXTAREA_CLS} rows={3} value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="영웅 조합, 역할 설명..." />
      </div>

      {/* 스킬 순서 */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">스킬 순서</label>
        <textarea className={TEXTAREA_CLS} rows={4} value={skillOrder} onChange={(e) => setSkillOrder(e.target.value)} placeholder="1. ...\n2. ..." />
      </div>

      {/* 장비 세팅 */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">장비 세팅</label>
        <textarea className={TEXTAREA_CLS} rows={4} value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="각 영웅별 장비 세팅..." />
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1 gap-1.5" onClick={handleSave}><Save size={13} />저장</Button>
        <Button variant="outline" className="flex-1 gap-1.5" onClick={onCancel}><X size={13} />취소</Button>
      </div>
    </div>
  );
}

// ── 빌드 뷰 패널 ────────────────────────────────────────────────
function BuildViewPanel({
  buildData, currentDetail, isAdmin,
  onEditClick,
}: {
  buildData: PveBuildRecord | null;
  currentDetail: string;
  isAdmin: boolean;
  onEditClick: () => void;
}) {
  const details = buildData?.details ?? {};
  const activeData: Partial<PveBuildRecord | PveDetail> = currentDetail && details[currentDetail]
    ? details[currentDetail] : (buildData ?? {});

  const deck       = (activeData as PveBuildRecord).deck ?? null;
  const skillOrder = (activeData as PveBuildRecord).skill_order ?? null;
  const equipment  = (activeData as PveBuildRecord).equipment ?? null;
  const formations = (activeData as PveBuildRecord).formations ?? [];
  const maker      = (currentDetail && details[currentDetail])
    ? null : buildData?.maker ?? null;

  if (!buildData && !isAdmin) {
    return <p className="text-sm text-muted-foreground text-center py-8">등록된 공략이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {/* 작성자 */}
      {maker && <p className="text-[11px] text-muted-foreground">✏️ By. {maker}</p>}

      {/* 진형 */}
      {formations.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">🗺️ 진형</p>
          {formations.map((f, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{f.type}</p>
              <FormationPreview
                slots={Object.entries(f.slots).map(([pos, name]) => ({ pos: Number(pos), name }))}
                formationType={f.type}
              />
            </div>
          ))}
        </div>
      )}

      {/* 덱 조합 */}
      {deck && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">⚔️ 덱 조합</p>
          <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{deck}</p>
        </div>
      )}

      {/* 스킬 순서 */}
      {skillOrder && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">📜 스킬 순서</p>
          <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{skillOrder}</p>
        </div>
      )}

      {/* 장비 세팅 */}
      {equipment && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">🛡️ 장비 세팅</p>
          <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{equipment}</p>
        </div>
      )}

      {!deck && !skillOrder && !equipment && formations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">등록된 공략이 없습니다.</p>
      )}

      {isAdmin && (
        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onEditClick} className="text-xs gap-1.5">
            관리자 수정
          </Button>
        </div>
      )}
    </div>
  );
}

// ── 메인 PVE 클라이언트 ─────────────────────────────────────────
export default function PveClient({ isAdmin }: { isAdmin: boolean }) {
  const [activeTab, setActiveTab]       = useState<"siege" | "advent" | "raid">("siege");
  const [raidSubcat, setRaidSubcat]     = useState<string | null>(null);
  const [selected, setSelected]         = useState<{ category: string; contentId: string; title: string; type: ContentType } | null>(null);
  const [activeBuild, setActiveBuild]   = useState<BuildKey>("build1");
  const [activeTurn, setActiveTurn]     = useState("8");
  const [activeDetail, setActiveDetail] = useState("");
  const [builds, setBuilds]             = useState<Record<BuildKey, PveBuildRecord | null>>({ build1: null, build2: null, build3: null, build4: null });
  const [editMode, setEditMode]         = useState(false);
  const [saving, setSaving]             = useState(false);
  const [buildNames, setBuildNames]     = useState<Record<BuildKey, string>>({ build1: "빌드 1", build2: "빌드 2", build3: "빌드 3", build4: "빌드 4" });

  const fetchBuilds = useCallback(async (category: string, contentId: string, turnNum: string | null) => {
    const params = new URLSearchParams({ category, content_id: contentId });
    if (turnNum) params.set("turn_num", turnNum);
    const res = await fetch(`/api/pve?${params}`);
    if (!res.ok) return;
    const data: PveBuildRecord[] = await res.json();
    const map: Record<BuildKey, PveBuildRecord | null> = { build1: null, build2: null, build3: null, build4: null };
    const names: Record<BuildKey, string> = { build1: "빌드 1", build2: "빌드 2", build3: "빌드 3", build4: "빌드 4" };
    data.forEach((r) => {
      map[r.build_key] = r;
      names[r.build_key] = r.build_name ?? `빌드 ${r.build_key.replace("build", "")}`;
    });
    setBuilds(map);
    setBuildNames(names);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const turn = selected.type === "turn_build" ? activeTurn : null;
    fetchBuilds(selected.category, selected.contentId, turn);
  }, [selected, activeTurn, fetchBuilds]);

  function selectContent(category: string, id: string, name: string, type: ContentType = "build") {
    setSelected({ category, contentId: id, title: name, type });
    setActiveBuild("build1");
    setActiveDetail("");
    setEditMode(false);
  }

  async function handleSave(updated: Partial<PveBuildRecord>) {
    if (!selected) return;
    setSaving(true);
    const currentBuild = builds[activeBuild];
    const turn = selected.type === "turn_build" ? activeTurn : null;
    const payload = {
      category: selected.category,
      content_id: selected.contentId,
      build_key: activeBuild,
      turn_num: turn,
      ...currentBuild,
      ...updated,
    };
    await fetch("/api/pve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchBuilds(selected.category, selected.contentId, turn);
    setSaving(false);
    setEditMode(false);
  }

  const currentBuild = builds[activeBuild];
  const contentItems = selected
    ? null
    : raidSubcat
      ? PVE_CONTENT[raidSubcat] ?? []
      : PVE_CONTENT[activeTab] ?? [];

  const TAB_CLS = "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors";

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Castle size={22} />PVE 공략</h1>
        <p className="text-sm text-muted-foreground mt-1">공성전 · 강림원정대 · 레이드 공략을 확인하세요.</p>
      </div>

      {/* 뒤로가기 (선택 상태일 때) */}
      {selected && (
        <button
          onClick={() => { setSelected(null); setEditMode(false); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />목록으로
        </button>
      )}

      {!selected && (
        <>
          {/* 카테고리 탭 */}
          {!raidSubcat && (
            <div className="flex gap-2">
              {(["siege", "advent", "raid"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setRaidSubcat(null); }}
                  className={cn(TAB_CLS,
                    activeTab === tab
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/20"
                  )}
                >
                  {tab === "siege" ? "⚔️ 공성전" : tab === "advent" ? "🌟 강림원정대" : "🐉 레이드"}
                </button>
              ))}
            </div>
          )}

          {/* 레이드 서브카테고리 뒤로가기 */}
          {raidSubcat && (
            <button
              onClick={() => setRaidSubcat(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} />레이드
            </button>
          )}

          {/* 콘텐츠 그리드 */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(raidSubcat ? PVE_CONTENT[raidSubcat] : PVE_CONTENT[activeTab])?.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.children) { setRaidSubcat(item.children); }
                  else { selectContent(raidSubcat ?? activeTab, item.id, item.name, item.type ?? "build"); }
                }}
                className={cn(
                  "py-3 px-2 rounded-xl border text-sm font-semibold transition-all",
                  item.fire
                    ? "border-orange-500/40 bg-orange-900/10 text-orange-300 hover:bg-orange-500/15"
                    : "border-border bg-card hover:bg-accent/20 text-foreground"
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 상세 카드 */}
      {selected && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
          {/* 제목 */}
          <div>
            <h2 className="text-lg font-black">{selected.title}</h2>
            {currentBuild?.build_name && (
              <p className="text-sm text-muted-foreground mt-0.5">📌 {currentBuild.build_name}</p>
            )}
          </div>

          {/* 턴 선택 (파괴신류) */}
          {selected.type === "turn_build" && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">⏳ 턴 수</p>
              <div className="flex flex-wrap gap-1.5">
                {TURN_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setActiveTurn(t); setActiveDetail(""); }}
                    className={cn(
                      "px-3 py-1 rounded-lg border text-xs font-bold transition-colors",
                      activeTurn === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent/20"
                    )}
                  >
                    {t}턴
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 빌드 탭 */}
          <div className="flex gap-1.5 overflow-x-auto">
            {BUILD_KEYS.map((bk) => (
              <button
                key={bk}
                onClick={() => { setActiveBuild(bk); setActiveDetail(""); setEditMode(false); }}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap",
                  activeBuild === bk
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-border text-muted-foreground hover:bg-accent/20"
                )}
              >
                {buildNames[bk]}
              </button>
            ))}
          </div>

          {/* 세부사항 칩 */}
          {(() => {
            const details = currentBuild?.details ?? {};
            if (Object.keys(details).length === 0 && !isAdmin) return null;
            return (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => { setActiveDetail(""); setEditMode(false); }}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                    !activeDetail ? "border-foreground/40 text-foreground" : "border-border text-muted-foreground hover:bg-accent/20"
                  )}
                >
                  {currentBuild?.details ? "기본" : "기본"}
                </button>
                {Object.entries(details).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => { setActiveDetail(key); setEditMode(false); }}
                    className={cn(
                      "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                      activeDetail === key ? "border-foreground/40 text-foreground" : "border-border text-muted-foreground hover:bg-accent/20"
                    )}
                  >
                    {val.name}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* 구분선 */}
          <div className="border-t border-border/40" />

          {/* 뷰 / 편집 */}
          {editMode ? (
            <BuildEditPanel
              buildData={currentBuild}
              currentDetail={activeDetail}
              isAdmin={isAdmin}
              onSave={handleSave}
              onCancel={() => setEditMode(false)}
              onDetailChange={(key) => { setActiveDetail(key); }}
            />
          ) : (
            <BuildViewPanel
              buildData={currentBuild}
              currentDetail={activeDetail}
              isAdmin={isAdmin}
              onEditClick={() => setEditMode(true)}
            />
          )}

          {saving && <p className="text-xs text-muted-foreground text-center">저장 중...</p>}
        </div>
      )}
    </div>
  );
}
