# Visual Architecture & Data Flows

**Version:** 2.3  
**Status:** Approved Architectural Spec — Ready for Implementation  
**Financial System of Record:** Actual Budget (`https://budget.novianlabs.my.id`)  
**Tracker Operational Store:** Supabase (PostgreSQL)  
**Detailed Integration Spec:** [moneh-gateway/docs/ACTUAL_BUDGET_INTEGRATION.md](../../moneh-gateway/docs/ACTUAL_BUDGET_INTEGRATION.md)

---

## 1. System Layer Architecture & Role Separation

```text
┌─────────────────────────────────────────────────────────┐
│                       UI Layer                          │
│   SvelteKit Components & Pages (shadcn-svelte + Tailwind)│
└───────────┬─────────────────────────────────────────────┘
            │ Reactivity & UI State
            ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Query Layer                     │
│                     TanStack Query                      │
└───────────┬─────────────────────────────────────────────┘
            │ Centralized Service Calls (src/lib/services/)
            ▼
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
│                    (moneh-gateway)                      │
│        - Auth Guard & Session Validation                │
│        - Saga Dual-Write Orchestrator                   │
│        - Idempotency & Reconciliation Engine            │
└───────────┬─────────────────────────────────┬───────────┘
            │ SQL Queries                     │ Headless SDK API
            ▼                                 ▼
┌─────────────────────────────────┐ ┌─────────────────────────┐
│        Supabase Backend         │ │      Actual Budget      │
│   (Operational Store & Cache)   │ │  (System of Record:     │
│   - Fast queries & analytics    │ │   Accounts, Payees,     │
│   - Integration metadata        │ │   Ledger Transactions)  │
│   - Sync status & audit trail   │ └─────────────────────────┘
└─────────────────────────────────┘
```

### Key Architectural Responsibilities
- **Actual Budget**: Financial System of Record for Accounts, Payees, Categories, and Ledger entries.
- **Supabase**: Operational Store & Read Model for fast UI rendering, custom Tracker filters, dashboard analytics, integration status tracking (`sync_status`, `sync_failure_type`, `sync_error`, `idempotency_key`), and failure audit history. Not every Tracker field needs to exist in Actual Budget.
- **moneh-gateway**: Saga Orchestrator executing transactional dual-writes with compensating actions, idempotent request handling, and background reconciliation.
- **Reconciliation**: Safety net for distributed failures (timeouts, crashes, network drops) occurring outside the synchronous HTTP request lifecycle.

### Core Retry Safety Rule

> **A definite Actual Budget failure may be directly retried. An unresolved/ambiguous Actual Budget failure must be reconciled before any new financial transaction is created.**

---

## 2. Correlation Identifiers

Every expense operation uses two distinct identifiers:

| Identifier | Purpose | Lifecycle |
| :--- | :--- | :--- |
| `expense_id` (Supabase PK) | **Business identity** of the expense record. Immutable. Primary correlation key linking Supabase and Actual Budget. | Created on Supabase INSERT. Persists for the record lifetime, including `SYNC_FAILED` records. |
| `idempotency_key` | **Client/request operation identity**. Prevents duplicate `POST /api/expenses` processing at the gateway. | Generated per unique user submission. `UNIQUE` constraint in Supabase. |

Both identifiers are embedded in Actual Budget transaction metadata for reconciliation correlation:

```text
[moneh_expense_id: <expense_id>]
[moneh_idempotency_key: <idempotency_key>]
```

> [!NOTE]
> The exact Actual Budget field used for embedding correlation identifiers (e.g. `notes`) is **implementation-dependent**. See the full integration spec for the [implementation dependency details](../../moneh-gateway/docs/ACTUAL_BUDGET_INTEGRATION.md).

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as SvelteKit App (tracker-moneh)
    participant GW as API Gateway (moneh-gateway)
    participant Supabase as Supabase Auth

    User->>App: Enter Email & Password
    App->>GW: POST /api/auth/login { email, password }
    GW->>Supabase: signInWithPassword({ email, password })
    Supabase-->>GW: Return Session JWT + Auth User
    GW-->>App: Set-Cookie (sb-access-token, sb-refresh-token) & Return Session
    App->>GW: GET /api/expenses (with Cookie)
    GW-->>App: Return User Scoped Data from Supabase Operational Store
    App-->>User: Render Dashboard
```

---

## 4. Expense Creation & Saga-Based Dual-Write Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Form as Expense Form UI
    participant Service as Expense Service (lib/services/expenses.ts)
    participant GW as API Gateway (moneh-gateway)
    participant DB as Supabase Operational Store
    participant Actual as Actual Budget (System of Record)

    User->>Form: Submit Expense Entry
    Form->>Service: createExpense(payload)
    Service->>GW: POST /api/expenses (with idempotency_key)
    
    Note over GW,DB: 0. Idempotency Check
    GW->>DB: SELECT WHERE idempotency_key = ?
    alt Already SYNCED
        GW-->>Service: 201 Created (cached result)
    else In-progress (PENDING / RECONCILIATION_REQUIRED / ROLLBACK_PENDING)
        GW-->>Service: 409 Conflict (operation in progress)
    else SYNC_FAILED + DEFINITE_FAILURE
        Note over GW: Partial Saga retry (skip Phase 2)
    else SYNC_FAILED + RECONCILIATION_EXHAUSTED
        GW->>DB: UPDATE SET sync_status='RECONCILIATION_REQUIRED', sync_failure_type=NULL
        GW-->>Service: 202 Accepted (reconciliation required before retry)
    end

    Note over GW,Actual: 1. Payee Resolution (Durable Master-Data Side Effect)
    GW->>Actual: Resolve or Create Payee
    alt Payee Resolution Fails
        Actual-->>GW: Error
        GW-->>Service: 500 Error (No expense created)
    end
    
    Note over GW,DB: 2. Operational Store Write (skipped if retrying SYNC_FAILED)
    GW->>DB: INSERT INTO expenses (sync_status='PENDING', idempotency_key=..., ...)
    alt Supabase Insert Fails
        DB-->>GW: SQL Error
        GW-->>Service: Return 400/500 Error (Actual write not attempted)
    else Supabase Insert Succeeds
        DB-->>GW: Return inserted row (expense_id)
        
        Note over GW,Actual: 3. System of Record Write
        GW->>Actual: api.addTransactions(accountId, [tx with expense_id + idempotency_key])
        
        alt Option A: Definite Success
            Actual-->>GW: Return actual_transaction_id
            GW->>DB: UPDATE SET actual_transaction_id=..., sync_status='SYNCED', synced_at=NOW()
            alt DB Update Succeeds
                GW-->>Service: Return 201 Created (sync_status='SYNCED')
            else DB Update Fails
                Note over GW: Actual has the transaction but DB still PENDING -> Reconciliation resolves
                GW-->>Service: Return 202 Accepted (queued for reconciliation)
            end
        else Option B: Definite Failure
            Actual-->>GW: Definite Error (4xx / Validation)
            GW->>DB: UPDATE SET sync_status='ROLLBACK_PENDING', sync_error='reason'
            GW->>DB: UPDATE SET sync_status='SYNC_FAILED', sync_failure_type='DEFINITE_FAILURE'
            GW-->>Service: Return 400/500 Error (sync_error in response)
        else Option C: Ambiguous Failure / Timeout
            Actual-->>GW: Timeout / Connection Lost
            GW->>DB: UPDATE SET sync_status='RECONCILIATION_REQUIRED', sync_error='Timeout'
            GW-->>Service: Return 202 Accepted (processing in background)
        end
    end
```

### Record Preservation & Retry Policy

Failed expense records are **never hard-deleted** as the default compensation strategy. On definite failure:

```text
sync_status:       PENDING → ROLLBACK_PENDING → SYNC_FAILED
sync_failure_type: NULL    → NULL              → DEFINITE_FAILURE
sync_error:        NULL    → '<reason>'        → '<reason>'
```

The record is preserved for failure observability, audit trail, and potential retry.

### Failure Classification & Retry Behavior

| `sync_failure_type` | Meaning | Retry Behavior |
| :--- | :--- | :--- |
| `DEFINITE_FAILURE` | Actual Budget definitively rejected the transaction. No transaction was created. | Safe to directly retry → `PENDING` → Partial Saga. |
| `RECONCILIATION_EXHAUSTED` | Gateway could not determine whether the transaction exists after exhausting reconciliation. | **Must reconcile first** → `RECONCILIATION_REQUIRED` → determine state → then retry if safe. |

See the [full retry specification](../../moneh-gateway/docs/ACTUAL_BUDGET_INTEGRATION.md) for detailed flows.

---

## 5. Sync State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Expense Inserted in Supabase

    PENDING --> SYNCED : Actual Insert & DB Update Succeed
    PENDING --> ROLLBACK_PENDING : Actual Insert Definite Failure
    PENDING --> RECONCILIATION_REQUIRED : Actual Timeout / Network Failure / Gateway Crash

    ROLLBACK_PENDING --> SYNC_FAILED : failure_type = DEFINITE_FAILURE

    RECONCILIATION_REQUIRED --> SYNCED : Reconciliation Confirms Transaction Exists
    RECONCILIATION_REQUIRED --> PENDING : Reconciliation Confirms Missing + Retry Safe (guarded)
    RECONCILIATION_REQUIRED --> SYNC_FAILED : failure_type = RECONCILIATION_EXHAUSTED

    SYNC_FAILED --> PENDING : Retry (DEFINITE_FAILURE only)
    SYNC_FAILED --> RECONCILIATION_REQUIRED : Retry (RECONCILIATION_EXHAUSTED)
```

### Guarded Transition: `RECONCILIATION_REQUIRED → PENDING`

This transition is **only** permitted when reconciliation has confirmed:
1. No matching transaction exists in Actual Budget for this `expense_id` / `idempotency_key`.
2. The original operation is safe to retry (no partial or ambiguous state).
3. All correlation lookups returned negative.

If the state cannot be safely determined, the record **remains** in `RECONCILIATION_REQUIRED` until the next reconciliation cycle. It transitions to `SYNC_FAILED` with `sync_failure_type = 'RECONCILIATION_EXHAUSTED'` only after the retry policy is exhausted.

### Stale `ROLLBACK_PENDING` Recovery

If the gateway crashes between setting `ROLLBACK_PENDING` and `SYNC_FAILED`, reconciliation detects stale records (past the grace period) and advances them to `SYNC_FAILED` with `sync_failure_type = 'DEFINITE_FAILURE'`, since the Actual Budget failure was already confirmed as definite.

---

## 6. Failure Handling & Recovery Matrix

| Failure Scenario | `sync_status` | `sync_failure_type` | Actual Budget State | Recovery Action |
| :--- | :--- | :--- | :--- | :--- |
| **Payee creation fails** | No record | — | No payee / No transaction | Return error to UI. |
| **Supabase insert fails** | No record | — | Payee may exist (durable) | Return error to UI. Actual write not attempted. |
| **Actual definite failure** | `ROLLBACK_PENDING` → `SYNC_FAILED` | `DEFINITE_FAILURE` | No transaction | Record failure. Safe to retry. |
| **Actual timeout** | `RECONCILIATION_REQUIRED` | `NULL` | Unknown | Return 202. Reconciliation resolves. |
| **Actual succeeds, Supabase update fails** | `PENDING` (stale) | `NULL` | Transaction exists | Reconciliation → `SYNCED`. |
| **Gateway crashes after Actual succeeds** | `PENDING` / `RECONCILIATION_REQUIRED` | `NULL` | Transaction exists | Reconciliation → `SYNCED`. |
| **Gateway crashes between `ROLLBACK_PENDING` and `SYNC_FAILED`** | `ROLLBACK_PENDING` (stale) | `NULL` | No transaction | Reconciliation → `SYNC_FAILED` (`DEFINITE_FAILURE`). |
| **Reconciliation confirms transaction exists** | → `SYNCED` | `NULL` | Transaction exists | Link `actual_transaction_id`. |
| **Reconciliation confirms missing + retry safe** | → `PENDING` | `NULL` | No transaction | Safe retry on next cycle. |
| **Reconciliation cannot determine state** | Remains `RECONCILIATION_REQUIRED` | `NULL` | Unknown | Retry on next reconciliation cycle. |
| **Reconciliation exhausted** | → `SYNC_FAILED` | `RECONCILIATION_EXHAUSTED` | Unknown | Manual intervention. **NOT safe to directly retry.** |
| **Retry of `DEFINITE_FAILURE`** | → `PENDING` | `NULL` | No transaction | Partial Saga (Phase 1 + 3, skip Phase 2). |
| **Retry of `RECONCILIATION_EXHAUSTED`** | → `RECONCILIATION_REQUIRED` | `NULL` | Unknown | Reconciliation first, then retry if safe. |
