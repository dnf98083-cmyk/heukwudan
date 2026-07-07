-- defense_teams 테이블에 team_type 구분 컬럼 추가
-- 'our'   = 우리 길드 방어팀 (방어팀 공략 페이지)
-- 'enemy' = 상대 방어팀    (길드전 페이지)
alter table defense_teams
  add column team_type text not null default 'enemy'
  check (team_type in ('our', 'enemy'));
