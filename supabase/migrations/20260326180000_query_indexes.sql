-- Indexes for the queries the app actually runs.
-- Plans are listed by recency; participants and chats are looked up by user.

create index if not exists activity_plans_created_idx
  on public.activity_plans (created_at desc);

create index if not exists activity_plans_category_created_idx
  on public.activity_plans (category, created_at desc);

create index if not exists plan_participants_user_idx
  on public.plan_participants (user_id, status);

create index if not exists connections_requester_idx
  on public.connections (requester_id, status);

create index if not exists conversation_participants_user_idx
  on public.conversation_participants (user_id);
