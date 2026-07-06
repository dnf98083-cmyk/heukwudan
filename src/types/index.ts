export type Role = "일반" | "관리자";
export type Result = "승" | "패";
export type HeroRole = "딜러" | "탱커" | "힐러" | "서폿";
export type Element = "화" | "수" | "목" | "광" | "암";

export interface GuildMember {
  id: string;
  nickname: string;
  role: Role;
  created_at: string;
}

export interface Hero {
  id: string;
  name: string;
  role: HeroRole | null;
  element: Element | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export interface DefenseTeam {
  id: string;
  title: string;
  hero_names: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
  strategies?: DefenseStrategy[];
}

export interface DefenseStrategy {
  id: string;
  team_id: string;
  strategy_num: number;
  equipment: string | null;
  main_option: string | null;
  stats: string | null;
  note: string | null;
  memo: string | null;
  created_at: string;
}

export interface DefenseRecord {
  id: string;
  player_name: string;
  team_id: string | null;
  result: Result;
  opponent: string | null;
  memo: string | null;
  season: number;
  recorded_at: string;
  defense_teams?: Pick<DefenseTeam, "id" | "title">;
}

export interface WinRate {
  player_name: string;
  wins: number;
  losses: number;
  total: number;
  rate: number;
}
