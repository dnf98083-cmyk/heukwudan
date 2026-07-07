/**
 * 영웅 이름 스마트 검색
 * - 직접 포함: "여포" → "여포" 매칭
 * - 파트 약어: "브브" → "브란즈&브란셀" 매칭 (각 파트 첫 글자)
 * - 파트 포함: "란" → "브란즈" 매칭
 */
export function searchHeroes<T extends { name: string }>(items: T[], query: string): T[] {
  if (!query.trim()) return items;
  const q = query.trim();

  function score(name: string): number {
    if (name === q) return 100;
    let s = 0;

    if (name.startsWith(q)) s += 20;
    if (name.includes(q)) s += 10;

    // 공백, &, +, · 등으로 파트 분리
    const parts = name.split(/[\s&+·,.\/]+/).filter(Boolean);

    // 여러 파트인 경우: 각 파트 첫 글자로 약어 생성 (브란즈&브란셀 → 브브)
    if (parts.length > 1) {
      const abbr = parts.map((p) => p[0] ?? "").join("");
      if (abbr === q) s += 18;
      else if (abbr.startsWith(q)) s += 12;
      else if (abbr.includes(q)) s += 6;
    }

    // 각 파트에서 개별 매칭
    parts.forEach((p) => {
      if (p.startsWith(q)) s += 6;
      else if (p.includes(q)) s += 2;
    });

    return s;
  }

  return items
    .map((item) => ({ item, s: score(item.name) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ item }) => item);
}
