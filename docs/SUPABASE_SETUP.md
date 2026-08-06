# Supabase Setup & Developer Guide

**Version:** 0.1  
**Status:** Approved Specification  
**Base Specs:** [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DATABASE.md](DATABASE.md), [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 1. Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally (`npm i -g supabase` or via Scoop/Homebrew).
- Docker Desktop running (required for local Supabase development).
- Active Supabase Cloud Account.

---

## 2. Initial Setup & Project Linking

### Step 1: Login to Supabase CLI
Authenticate CLI with your Supabase account:
```bash
supabase login
```

### Step 2: Initialize Project Configuration (If not initialized)
```bash
supabase init
```

### Step 3: Link Local Repository to Remote Supabase Project
Link your local codebase to the target Supabase project ID (found in Supabase Dashboard -> Project Settings):
```bash
supabase link --project-ref <your-project-id>
```

---

## 3. Local Development Workflow

Start local Supabase containers (PostgreSQL, Auth, Storage, Edge Functions, Studio UI):
```bash
# Start local containers
supabase start

# View local credentials & Studio URL (http://localhost:54323)
supabase status

# Stop local containers
supabase stop
```

---

## 4. Migration & Schema Workflow

Database migrations are managed strictly via Supabase CLI.

### Creating a New Migration
```bash
supabase migration new <migration_name>
# Example: supabase migration new add_merchant_to_expenses
```
This generates a versioned file at `supabase/migrations/<timestamp>_<migration_name>.sql`.

### Applying Pending Migrations
Apply unapplied migrations to the connected environment:
```bash
# Local environment
supabase db push

# Remote production environment
supabase db push --linked
```

---

## 5. TypeScript Type Generation

Automatically generate TypeScript definitions from your PostgreSQL schema:

```bash
# Generate types from local database container
supabase gen types typescript --local > src/lib/types/database.types.ts

# Or generate types from remote linked project
supabase gen types typescript --linked > src/lib/types/database.types.ts
```

---

## 6. Edge Function Setup & Secret Management

### Deploying Edge Functions
Deploy the Google Sheets sync Edge Function:
```bash
supabase functions deploy sync-google-sheets
```

### Setting Remote Secrets
Configure Google Service Account credentials in Supabase Edge Function environment:
```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
supabase secrets set GOOGLE_SPREADSHEET_ID="1abcXYZ..."
```

### Viewing Edge Function Logs
```bash
supabase functions logs sync-google-sheets
```

---

## 7. Command Cheat Sheet

| Action | Command |
| :--- | :--- |
| Start local Supabase | `supabase start` |
| Stop local Supabase | `supabase stop` |
| New Migration | `supabase migration new <name>` |
| Push Migrations | `supabase db push` |
| Generate Types | `supabase gen types typescript --local > src/lib/types/database.types.ts` |
| Deploy Function | `supabase functions deploy sync-google-sheets` |
| Set Secrets | `supabase secrets set KEY=VALUE` |
