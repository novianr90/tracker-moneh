# Google Sheets Sync Integration Guide

**Version:** 0.1  
**Status:** Operational Specification  
**Architecture Spec:** [ARCHITECTURE.md](ARCHITECTURE.md) | [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

---

## 1. Overview

TrackerMoneh integrates with Google Sheets to export and reconcile personal expense data. The sync mechanism runs via a serverless **Supabase Edge Function** (`sync-google-sheets`) invoked directly from the SvelteKit application (`/sync`).

### Key Features
- **Unidirectional & Reconciled Sync**: Exports transactions from `public.recent_expenses` to a target Google Sheet.
- **Deleted Item Handling**: Items soft-deleted or deleted in the database are marked with a `[DELETED]` prefix and strikethrough formatting.
- **Audit Logging**: Every sync attempt records `status`, `synced_count`, `started_at`, and `finished_at` in `public.sync_logs`.

---

## 2. Prerequisites

1. Active **Google Cloud Platform (GCP)** project with billing enabled (Google Sheets API is free-tier eligible).
2. A **Google Sheet** created in your personal Google Drive.
3. Installed **Supabase CLI** connected to your Supabase project.

---

## 3. Step-by-Step Setup Guide

### Step 1: Create a Google Cloud Service Account

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g., `tracker-moneh`).
3. Enable the **Google Sheets API**:
   - Go to **APIs & Services** -> **Library**.
   - Search for **Google Sheets API** and click **Enable**.
4. Create Service Account Credentials:
   - Go to **APIs & Services** -> **Credentials**.
   - Click **Create Credentials** -> **Service Account**.
   - Name: `tracker-moneh-sync`
   - Grant role: **Project -> Editor** (or leave default if only accessing shared sheets).
   - Click **Done**.
5. Generate JSON Key:
   - Click on the newly created Service Account.
   - Go to the **Keys** tab -> **Add Key** -> **Create new key**.
   - Select **JSON** and download the key file.

---

### Step 2: Share Google Sheet with Service Account

1. Create a new Google Sheet (or use an existing one).
2. Extract the `SPREADSHEET_ID` from the Google Sheet URL:
   ```text
   https://docs.google.com/spreadsheets/d/1abcXYZ1234567890_EXAMPLE_ID/edit
                                          └─────── SPREADSHEET_ID ───────┘
   ```
3. Open the downloaded JSON key file and find `"client_email"`:
   ```json
   "client_email": "tracker-moneh-sync@project-id.iam.gserviceaccount.com"
   ```
4. Click the **Share** button in your Google Sheet.
5. Add the `client_email` address as an **Editor** and click **Share**.

---

### Step 3: Configure Supabase Edge Function Secrets

Configure the credentials in your Supabase environment using the Supabase CLI:

```bash
# Set Google Service Account Email
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="tracker-moneh-sync@your-project-id.iam.gserviceaccount.com"

# Set Target Google Spreadsheet ID
supabase secrets set GOOGLE_SPREADSHEET_ID="1abcXYZ1234567890_EXAMPLE_ID"

# Set Private Key (Note: Ensure linebreaks in RSA key are preserved or escaped with \n)
supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgw...==\n-----END PRIVATE KEY-----\n"
```

> [!TIP]
> You can also configure secrets directly via the **Supabase Dashboard**:  
> **Project Settings** -> **Edge Functions** -> **Add Secret**.

---

### Step 4: Deploy the Edge Function

Deploy the sync Edge Function to your live Supabase project:

```bash
supabase functions deploy sync-google-sheets
```

---

## 4. Triggering & Monitoring Sync

### From the User Interface
1. Log into **TrackerMoneh**.
2. Navigate to `/sync` (**Sync & Logs** page).
3. Click **Sync Now**.
4. View real-time status and sync log history populated from `public.sync_logs`.

---

## 5. Troubleshooting & Audit Logs

### View Edge Function Logs
If sync fails, check real-time function execution logs:
```bash
supabase functions logs sync-google-sheets
```

### Common Error Codes

| Code | Cause | Resolution |
| :--- | :--- | :--- |
| `AUTH002` | Session expired or unauthenticated | Log out and log back into TrackerMoneh |
| `403 Forbidden` | Service Account lacks Editor access | Ensure Google Sheet is shared with `client_email` as Editor |
| `404 Not Found` | Invalid `GOOGLE_SPREADSHEET_ID` | Verify ID in Google Sheet URL and update secret |
| `INVALID_KEY` | Private Key formatting error | Ensure private key includes `\n` linebreaks and headers |
