-- ============================================================
-- 흑우단 공략 사이트 초기 스키마
-- ============================================================

-- 1. 길드원 테이블 (로그인 + 권한 관리)
create table guild_members (
  id          uuid primary key default gen_random_uuid(),
  nickname    text not null unique,
  entry_code  char(6) not null,
  role        text not null default '일반' check (role in ('일반', '관리자')),
  created_at  timestamptz default now()
);

-- 2. 영웅 도감
create table heroes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  role        text check (role in ('딜러', '탱커', '힐러', '서폿')),
  element     text check (element in ('화', '수', '목', '광', '암')),
  image_url   text,
  description text,
  created_at  timestamptz default now()
);

-- 3. 방어팀 (영웅 조합 묶음)
create table defense_teams (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,          -- "여포 브브 칼헬론"
  hero_names    text[] not null default '{}',
  display_order int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger defense_teams_updated_at
  before update on defense_teams
  for each row execute function update_updated_at();

-- 4. 방어팀 공략 안 (1안/2안/3안...)
create table defense_strategies (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references defense_teams(id) on delete cascade,
  strategy_num  int not null check (strategy_num >= 1),
  equipment     text,   -- 장비
  main_option   text,   -- 메인옵
  stats         text,   -- 스탯
  note          text,   -- 특이사항
  memo          text,   -- 추가메모
  created_at    timestamptz default now(),
  unique(team_id, strategy_num)
);

-- 5. 수비 기록 (승패)
create table defense_records (
  id           uuid primary key default gen_random_uuid(),
  player_name  text not null,
  team_id      uuid references defense_teams(id) on delete set null,
  result       text not null check (result in ('승', '패')),
  opponent     text,
  memo         text,
  season       int not null default 1,  -- 시즌 초기화 시 +1
  recorded_at  timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security) 설정
-- ============================================================

alter table guild_members enable row level security;
alter table heroes enable row level security;
alter table defense_teams enable row level security;
alter table defense_strategies enable row level security;
alter table defense_records enable row level security;

-- 모든 테이블: 누구나 읽기 가능 (공략 사이트 특성상)
create policy "공개 읽기" on guild_members for select using (true);
create policy "공개 읽기" on heroes for select using (true);
create policy "공개 읽기" on defense_teams for select using (true);
create policy "공개 읽기" on defense_strategies for select using (true);
create policy "공개 읽기" on defense_records for select using (true);

-- 쓰기/수정/삭제: 서버 사이드(service_role)에서만
-- (API Route에서 service_role 키로 처리 — 클라이언트에 노출 X)
