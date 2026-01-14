-- Enable the extension
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Verify it's enabled: select * from cron.job;

-- Schedule the function to run at 11:00 AM daily
select cron.schedule(
  'send-notifications-morning',
  '0 11 * * *', -- Cron syntax for 11:00 AM
  $$
  select
      net.http_post(
          url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
  $$
);

-- Schedule the function to run at 4:00 PM daily
select cron.schedule(
  'send-notifications-afternoon',
  '0 16 * * *', -- Cron syntax for 4:00 PM (16:00)
  $$
  select
      net.http_post(
          url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notifications',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
      ) as request_id;
  $$
);
