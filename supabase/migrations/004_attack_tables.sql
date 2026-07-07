-- 공격덱 테이블 (방어팀별 공격 공략)
create table attack_decks (
  id              uuid primary key default gen_random_uuid(),
  defense_team_id uuid references defense_teams(id) on delete cascade,
  name            text not null,
  speed_type      text check (speed_type in ('속공 따야 함', '내줘도 됨')),
  ring            text,
  pet             text,
  formation_type  text check (formation_type in ('기본', '밸런스', '공격', '보호')),
  formation       text,         -- 캐릭터 이름들 (공백 구분)
  skill_order     text,
  equipment       text,
  wins            int not null default 0,
  losses          int not null default 0,
  last_used_at    timestamptz,
  created_by      text,
  created_at      timestamptz default now()
);

-- 길드전 개별 전적 기록
create table guild_war_records (
  id           uuid primary key default gen_random_uuid(),
  player_name  text not null,
  deck_id      uuid references attack_decks(id) on delete cascade,
  result       text not null check (result in ('승', '패')),
  season       int not null default 1,
  recorded_at  timestamptz default now()
);

-- RLS
alter table attack_decks enable row level security;
alter table guild_war_records enable row level security;

create policy "공개 읽기" on attack_decks for select using (true);
create policy "공개 읽기" on guild_war_records for select using (true);
