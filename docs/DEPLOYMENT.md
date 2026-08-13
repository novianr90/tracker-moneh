# Deployment & Operational Specification: Personal Expense Tracker

**Version:** 0.2  
**Status:** Approved Architectural Spec  
**Base Docs:** [PRD-Personal-Expense-Tracker.md](PRD-Personal-Expense-Tracker.md), [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DATABASE.md](DATABASE.md), [DECISIONS.md](DECISIONS.md)

---

## 1. Overview

This document defines the deployment lifecycle, migration strategy, and operational procedures (backup, recovery, and rollback) for the Personal Expense Tracker application.

The application architecture consists of:
- **SvelteKit Frontend:** Hosted on static/node hosting (e.g. Vercel / Netlify / Self-hosted container).
- **Supabase Backend:** PostgreSQL database, Auth, RLS policies, and Edge Functions.
- **Reporting Layer:** Google Spreadsheet synced via Edge Function.

---

## 2. Environment Management

Environments are separated by **distinct Supabase Projects**:
- **Development Project:** Used for local testing and feature branches.
- **Production Project:** Dedicated project for live application data.

---

## 3. Standard Deployment Sequence

Database schema migrations **must always** be executed before deploying frontend application builds.

```text
git pull
   │
   ▼
supabase db push
   │
   ▼
npm install
   │
   ▼
npm run build
   │
   ▼
Restart Application
```

### Execution Steps:

1. **Pull Main Codebase:**
   ```bash
   git pull origin main
   ```
2. **Apply Pending Database Migrations:**
   ```bash
   supabase db push
   ```
   *Ensures new tables, views, RPCs, or columns exist before application code references them.*
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Build Production Frontend:**
   ```bash
   npm run build
   ```
5. **Restart Server / Refresh Container Service.**

---

## 4. Edge Functions Deployment

Deploy updated Edge Functions independently using Supabase CLI:

```bash
supabase functions deploy sync-google-sheets
```

Verify secrets are set in target environment:
```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="..." GOOGLE_PRIVATE_KEY="..." GOOGLE_SPREADSHEET_ID="..."
```

---

## 5. Backup & Recovery Procedures

### 5.1 Database Backup Strategy
- **Automated Backups:** Supabase performs daily automated PostgreSQL database backups.
- **Point-In-Time Recovery (PITR):** Production instance supports PITR, allowing restoration to any specific second within retention window.
- **Manual Backups:** Can be generated via CLI:
  ```bash
  supabase db dump -f backup.sql
  ```

### 5.2 Database Restore Strategy
- In case of critical database corruption, initiate Point-In-Time Recovery via Supabase Project Dashboard under `Database -> Backups`.
- Select target restore timestamp immediately prior to incident occurrence.

### 5.3 Google Spreadsheet Recovery
- **Google Sheets Revision History:** If data corruption occurs in the spreadsheet, use Google Sheets built-in Version History (`File -> Version history -> See version history`) to restore to a known good state.
- **Re-Sync Trigger:** Triggering manual sync from the application will reconcile and mirror all valid database records back to the spreadsheet.

### 5.4 Deployment & Migration Rollback Procedure
1. **Frontend Rollback:** Revert frontend host build to previous stable commit tag.
2. **Database Rollback:** 
   - Migrations should always be additive.
   - If a rollback requires reverting schema changes, create a new compensating migration file (`supabase migration new revert_<feature>`) and apply via `supabase db push`.
   - Never manually drop production tables.

---

## 6. Coolify & Docker Deployment Guide

### 6.1 Configuration in Coolify
1. **New Resource:** Select **Public/Private Repository** or **Dockerfile** build pack.
2. **Port:** Expose port `3000`.
3. **Environment Variables & Build Arguments:**
   - `PUBLIC_SUPABASE_URL`: Your Supabase project URL (e.g. `https://xxx.supabase.co`).
   - `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anon key.
   - `ORIGIN`: The public HTTPS URL where your app is hosted (e.g. `https://moneh.yourdomain.com`).
   - `ENABLE_SYNC`: `true`
   - `ENABLE_DEBUG`: `false`

*Note: In Coolify, ensure environment variables marked as build variables or passed as ARGs during image build.*

