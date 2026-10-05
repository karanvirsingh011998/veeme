-- =============================================================================
-- Admin read access for revenue + chats oversight
-- =============================================================================

drop policy if exists "payments_admin_select_all" on public.payments;
create policy "payments_admin_select_all" on public.payments
  for select using (public.is_admin());

drop policy if exists "conversations_admin_select_all" on public.conversations;
create policy "conversations_admin_select_all" on public.conversations
  for select using (public.is_admin());

drop policy if exists "conversation_participants_admin_select_all"
  on public.conversation_participants;
create policy "conversation_participants_admin_select_all"
  on public.conversation_participants
  for select using (public.is_admin());

drop policy if exists "messages_admin_select_all" on public.messages;
create policy "messages_admin_select_all" on public.messages
  for select using (public.is_admin());
