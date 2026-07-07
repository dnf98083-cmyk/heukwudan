-- 공격한 성 + 상대 닉네임 추가 (오늘의 길드전 기능)
alter table guild_war_records
  add column castle_type text,
  add column opponent_name text;
