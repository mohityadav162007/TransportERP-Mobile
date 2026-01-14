-- Create table for storing FCM tokens
create table if not exists public.fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  token text not null,
  device_type text,
  last_updated timestamptz default now(),
  unique(user_id, token)
);

-- RLS Policies
alter table public.fcm_tokens enable row level security;

create policy "Users can insert their own tokens"
on public.fcm_tokens for insert
to authenticated
with check (true);

create policy "Users can view their own tokens"
on public.fcm_tokens for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own tokens"
on public.fcm_tokens for update
to authenticated
using (auth.uid() = user_id);

-- Optional: Allow service role to view/manage all tokens (for sending notifications)
create policy "Service role can manage all tokens"
on public.fcm_tokens
using (auth.role() = 'service_role');
