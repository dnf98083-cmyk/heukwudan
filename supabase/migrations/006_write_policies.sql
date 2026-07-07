-- 모든 테이블 쓰기 허용 (길드 내부 도구 — anon key는 공개 안 함)
create policy "공개 삽입" on heroes for insert with check (true);
create policy "공개 수정" on heroes for update using (true);
create policy "공개 삭제" on heroes for delete using (true);

create policy "공개 삽입" on defense_teams for insert with check (true);
create policy "공개 수정" on defense_teams for update using (true);
create policy "공개 삭제" on defense_teams for delete using (true);

create policy "공개 삽입" on defense_strategies for insert with check (true);
create policy "공개 수정" on defense_strategies for update using (true);
create policy "공개 삭제" on defense_strategies for delete using (true);

create policy "공개 삽입" on attack_decks for insert with check (true);
create policy "공개 수정" on attack_decks for update using (true);
create policy "공개 삭제" on attack_decks for delete using (true);

create policy "공개 삽입" on guild_war_records for insert with check (true);

-- 승/패 기록 원자적 처리 함수 (wins/losses 동시 증가 + 기록 삽입)
create or replace function record_attack_result(
  p_deck_id  uuid,
  p_result   text,
  p_player   text
) returns void language plpgsql as $$
begin
  if p_result = '승' then
    update attack_decks
    set wins = wins + 1, last_used_at = now()
    where id = p_deck_id;
  else
    update attack_decks
    set losses = losses + 1, last_used_at = now()
    where id = p_deck_id;
  end if;

  insert into guild_war_records (player_name, deck_id, result, season)
  values (p_player, p_deck_id, p_result, 1);
end;
$$;
