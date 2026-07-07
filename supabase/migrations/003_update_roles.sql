-- guild_members 권한 체계 변경
-- 기존: '일반' | '관리자'
-- 변경: '관리자' | '연구원' | '길드원'
-- 슈퍼개발자는 DB에 없음 (.env.local에만 존재)

alter table guild_members
  drop constraint guild_members_role_check;

alter table guild_members
  add constraint guild_members_role_check
  check (role in ('관리자', '연구원', '길드원'));

-- 기존 '일반' 데이터가 있다면 '길드원'으로 변경
update guild_members set role = '길드원' where role = '일반';
