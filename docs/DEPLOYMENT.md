# Deployment & Operational Specification: Personal Expense Tracker

**Version:** 1.1  
**Status:** Approved Architectural Spec  
**Base Docs:** [PRD-Personal-Expense-Tracker.md](PRD-Personal-Expense-Tracker.md), [TECHNICAL-SPECIFICATION.md](TECHNICAL-SPECIFICATION.md), [DATABASE.md](DATABASE.md), [DECISIONS.md](DECISIONS.md)

---

## 1. Overview

The application architecture is deployed as two independent container services on **Coolify** / Docker:

1. **`moneh-gateway` (Fastify API Gateway):**
   - Node.js 22 Alpine multi-stage Docker container.
   - Internal/External port: `4000` (configurable via `PORT`).
   - Hosts all Supabase DB migrations, Actual Budget SDK connections, Saga dual-write orchestrator, and Google Sheets sync triggers.
2. **`tracker-moneh` (SvelteKit Frontend):**
   - Node.js 22 Alpine multi-stage Docker container.
   - Internal/External port: `3004` (configurable via `PORT`).
   - Calls `PUBLIC_GATEWAY_URL` exclusively.

---

## 2. Environment Configuration Matrix

### 2.1 Gateway (`moneh-gateway/.env`)
```env
PORT=4000
HOST=0.0.0.0
SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
CLIENT_ORIGIN=https://tracker.novianlabs.my.id,http://localhost:3004,http://localhost:5173

# Feature Flag: Set to true when ready to sync with Actual Budget
USE_ACTUAL=false

# Actual Budget Configuration
ACTUAL_SERVER_URL=https://budget.novianlabs.my.id
ACTUAL_PASSWORD=your-actual-password
ACTUAL_SYNC_ID=your-sync-id
ACTUAL_DATA_DIR=./budget-data

# Reconciliation Configuration
RECONCILIATION_INTERVAL_MS=60000
RECONCILIATION_GRACE_PERIOD_MS=120000
MAX_RECONCILIATION_RETRIES=3
```

### 2.2 Frontend (`tracker-moneh/.env`)
```env
PORT=3004
PUBLIC_GATEWAY_URL=https://moneh-gateway.novianlabs.my.id # or http://localhost:4000
ENABLE_SYNC=true
ENABLE_DEBUG=false
```

---

## 3. Coolify Deployment Steps

### 3.1 Deploying `moneh-gateway`
1. Create a new Service in Coolify $\rightarrow$ Select Git Repository (`moneh-gateway`).
2. Set Build Pack: **Dockerfile**.
3. Set Port: **4000** (Healthcheck endpoint: `/api/health`).
4. Set Environment Variables as defined above.
5. Trigger Deploy.

### 3.2 Deploying `tracker-moneh`
1. Create a new Service in Coolify $\rightarrow$ Select Git Repository (`tracker-moneh`).
2. Set Build Pack: **Dockerfile**.
3. Set Port: **3004**.
4. Set Environment Variables (`PUBLIC_GATEWAY_URL`, `PORT=3004`).
5. Trigger Deploy.

---

## 4. Standard Migration & Deployment Sequence

Database schema migrations are located in `moneh-gateway/supabase/migrations/` and must be applied before frontend releases:

```bash
cd moneh-gateway

# Apply database migrations
supabase db push

# Deploy edge functions
supabase functions deploy sync-google-sheets
```
