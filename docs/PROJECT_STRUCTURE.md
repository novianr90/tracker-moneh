# Project Structure & Directory Guidelines

**Version:** 1.1  
**Status:** Updated Specification  
**Architecture:** Decoupled Frontend (`tracker-moneh`) + Fastify Gateway (`moneh-gateway`)

---

## 1. Multi-Service Workspace Overview

The project is structured into two focused services:
1. **`tracker-moneh/`**: Pure SvelteKit frontend UI client.
2. **`moneh-gateway/`**: Fastify backend API Gateway, Saga dual-write orchestrator, Supabase database migration host, and Actual Budget SDK integration.

```text
moneh/
├── tracker-moneh/             # Frontend SvelteKit 2 App
│   ├── docs/                  # Architecture & System Documentation
│   ├── src/
│   │   ├── hooks.server.ts    # Server-side auth verification against Gateway
│   │   ├── app.d.ts           # SvelteKit global types
│   │   ├── lib/
│   │   │   ├── components/    # Svelte UI components (forms, dashboard, charts)
│   │   │   ├── services/      # HTTP Client Layer calling Gateway
│   │   │   │   ├── apiClient.ts      # Unified fetch wrapper targeting GATEWAY_URL
│   │   │   │   ├── auth.ts           # Login/Logout/Session methods
│   │   │   │   ├── expenses.ts       # Expense CRUD, aggregations & retry
│   │   │   │   ├── categories.ts     # Category CRUD (with is_active filter)
│   │   │   │   ├── paymentMethods.ts # Payment method CRUD (with is_active filter)
│   │   │   │   └── sync.ts           # Dual-Sync & Master Data trigger
│   │   │   ├── types/         # TypeScript definitions (database.types.ts)
│   │   │   └── utils/         # Currency (IDR) & Date formatters
│   │   └── routes/            # SvelteKit Page Routes (+layout, expenses, categories, sync)
│   ├── Dockerfile             # Multi-stage SvelteKit Node runner
│   └── package.json
│
└── moneh-gateway/             # Fastify Backend API Gateway & Ledger Orchestrator
    ├── docs/                  # Actual Budget Integration Specifications
    ├── supabase/              # Supabase Migrations & Edge Functions (Source of Truth)
    │   ├── functions/         # sync-google-sheets, scheduled-sync-google-sheets
    │   └── migrations/        # 0000 to 0008+ migration SQL files
    ├── src/
    │   ├── config/            # Environment configurations (USE_ACTUAL, ports, keys)
    │   ├── lib/               # Types and Supabase client
    │   ├── plugins/           # Fastify authentication & session plugins
    │   ├── routes/            # REST route controllers (auth, expenses, sync, etc.)
    │   ├── services/          # Business logic & Saga engines
    │   │   ├── actual.service.ts         # Actual Budget SDK manager & Master sync
    │   │   ├── expenses.service.ts       # Saga Dual-Write & retry orchestrator
    │   │   ├── reconciliation.service.ts # Background reconciliation runner
    │   │   ├── sync.service.ts           # Dual-sync reporting coordinator
    │   │   └── ...
    │   └── index.ts           # Server bootstrap & background workers
    ├── Dockerfile             # Multi-stage Fastify Node runner
    └── package.json
```

---

## 2. Frontend Layer Rules (`tracker-moneh`)

| Directory | Primary Responsibility | What BELONGS Here | What MUST NOT Belong Here |
| :--- | :--- | :--- | :--- |
| `src/lib/components/` | Visual presentation & user interactions | Svelte components, form fields, charts, badges | Raw API fetch calls, master credentials |
| `src/lib/services/` | HTTP Communication with Gateway | `apiClient.ts` calls to `PUBLIC_GATEWAY_URL` | Direct database connection strings, passwords |
| `src/lib/types/` | TypeScript type contracts | `database.types.ts`, DTO interfaces | Business logic implementations |
| `src/lib/utils/` | Formatting & pure utilities | IDR formatters, date formatters | Network requests |
| `src/routes/` | Page composition & layout | SvelteKit pages (`/`, `/expenses`, `/sync`) | Direct database queries |

---

## 3. Strict Architectural Principles

1. **Gateway Isolation:**
   - Frontend never talks directly to Supabase PostgreSQL or Actual Budget; all communication is mediated through `moneh-gateway`.
2. **Zero Credentials in Client:**
   - No database secret keys or Actual Budget passwords are baked into frontend bundles.
3. **Strong Typing:**
   - All models are synchronized with `database.types.ts` across both repositories.
