-- 공격덱에 시각적 진형 데이터 저장
-- [{pos: 1, name: "라드그리드"}, {pos: 4, name: "오공"}] 형태
-- null = 진형 미설정 (기존 데이터 호환)
alter table attack_decks
  add column formation_slots jsonb;
