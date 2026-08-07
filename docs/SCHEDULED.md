# Automated Scheduled Sync Guide (pg_cron & Edge Functions)

**Version:** 0.1  
**Status:** Operational Specification  
**Base Specs:** [SPREADSHEET.md](SPREADSHEET.md) | [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 1. Overview

TrackerMoneh supports background automated reconciliation with Google Sheets via **Supabase Edge Functions** (`scheduled-sync-google-sheets`) triggered by PostgreSQL's native scheduler extension (**`pg_cron`**).

This background mechanism continuously checks for un-synced transactions (`is_upload != 'Y'`), batches them per user, sends the payloads to Google Apps Script Web App, marks the transactions as synced (`is_upload = 'Y'`), and updates execution status in `public.sync_logs`.

---

## 2. Architecture & Workflow

```text
+-------------------------------------------------------------------+
|                        Supabase Cloud                             |
|                                                                   |
|  +--------------------+         +------------------------------+  |
|  | PostgreSQL pg_cron | ------> | Edge Function                |  |
|  | (Cron Scheduler)   | HTTP    | scheduled-sync-google-sheets |  |
|  +--------------------+ POST    +------------------------------+  |
|                                                |                  |
+------------------------------------------------|------------------+
                                                 | HTTP POST
                                                 v
                                  +------------------------------+
                                  | Google Apps Script Web App   |
                                  +------------------------------+
                                                 | Append Rows
                                                 v
                                  +------------------------------+
                                  | Google Spreadsheet           |
                                  +------------------------------+
```

---

## 3. Deployment Steps

### Step 1: Deploy the Scheduled Edge Function

Deploy `scheduled-sync-google-sheets` to your live Supabase project using Supabase CLI:

```bash
npx supabase functions deploy scheduled-sync-google-sheets
```

### Step 2: Configure Environment Secrets

Ensure `GOOGLE_SCRIPT_URL` and `SPREADSHEET_API_KEY` are configured in Supabase Edge Function environment secrets:

```bash
npx supabase secrets set GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/.../exec" SPREADSHEET_API_KEY="YOUR_API_KEY"
```

---

## 4. Enabling pg_cron Scheduler

Open the **Supabase SQL Editor** and execute the following SQL script to enable `pg_cron` and schedule your automated sync job:

```sql
-- 1. Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule automatic sync (Default: Every day at 00:00 UTC)
select cron.schedule(
  'daily-google-sheets-sync',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/scheduled-sync-google-sheets',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);
```

> [!IMPORTANT]  
> Replace `<YOUR_PROJECT_REF>` with your Supabase Project Reference ID and `<YOUR_SERVICE_ROLE_KEY>` with your `service_role` secret key from **Supabase Dashboard** -> **Project Settings** -> **API**.

---

## 5. Cron Frequency Reference

| Schedule | Cron Expression | Description |
| :--- | :--- | :--- |
| **Every 6 Hours** | `0 */6 * * *` | Frequent automated background sync for active spenders |
| **Daily at Midnight** | `0 0 * * *` | *(Recommended)* Nightly reconciliation of all un-synced transactions |
| **Weekly on Monday** | `0 0 * * 1` | Weekly batch sync every Monday at 00:00 UTC |

---

## 6. Managing Cron Jobs

### View Active Cron Jobs
```sql
select jobid, schedule, command, active, jobname 
from cron.job;
```

### Change / Update Schedule
```sql
-- Unschedules current job
select cron.unschedule('daily-google-sheets-sync');

-- Re-schedules with new expression (e.g. Every 6 Hours)
select cron.schedule(
  'daily-google-sheets-sync',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/scheduled-sync-google-sheets',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);
```

### Disable Scheduled Sync
```sql
select cron.unschedule('daily-google-sheets-sync');
```

### Inspect Cron Execution History & Logs
```sql
select * from cron.job_run_details 
order by start_time desc 
limit 10;
```
