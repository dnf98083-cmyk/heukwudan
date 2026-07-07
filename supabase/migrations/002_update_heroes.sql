-- heroes 테이블 타입 컬럼 변경
-- role/element → type (공격형/마법형/지원형/만능형/방어형)

alter table heroes drop column if exists role;
alter table heroes drop column if exists element;

alter table heroes
  add column type text check (type in ('공격형', '마법형', '지원형', '만능형', '방어형'));
