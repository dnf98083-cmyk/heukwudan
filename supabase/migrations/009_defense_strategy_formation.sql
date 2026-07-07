-- 방어팀에 진형 데이터 추가
alter table defense_teams
  add column formation_type text check (formation_type in ('기본', '밸런스', '공격', '보호')),
  add column formation_slots jsonb;
