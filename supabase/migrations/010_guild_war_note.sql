-- 공격 기록에 속공/메모 필드 추가
-- 패배 시 속공 상황을 기록해 두기 위함
alter table guild_war_records
  add column note text;
