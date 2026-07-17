-- 속공 계산 기록 테이블
create table if not exists speed_records (
  id uuid primary key default gen_random_uuid(),
  castle_type text not null,
  opponent_name text,
  enemy_heroes text[] not null default '{}',
  ally_heroes text[] not null default '{}',
  deck_id uuid,
  defense_team_id uuid,
  battle_order text[] not null default '{}',
  ally_speeds jsonb not null default '{}',
  enemy_speeds jsonb not null default '{}',
  ally_total int not null default 0,
  enemy_total int not null default 0,
  recorder_name text not null,
  recorded_at timestamptz not null default now()
);
