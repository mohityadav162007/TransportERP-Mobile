-- RUN THIS ONLY IF YOU WANT TO REMOVE ALL NOTIFICATION LOGIC

-- 1. Unschedule the cron jobs
select cron.unschedule('send-notifications-morning');
select cron.unschedule('send-notifications-afternoon');

-- 2. Delete the fcm_tokens table
drop table if exists fcm_tokens;

-- 3. (Optional) The Edge Function can be deleted via the Supabase Dashboard UI.
