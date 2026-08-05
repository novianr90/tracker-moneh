# Personal Expense Tracker PRD

**Version:** 0.1\
**Status:** Draft

------------------------------------------------------------------------

# 1. Overview

A lightweight personal expense tracker for two users (owner and spouse).
The application focuses on fast expense recording while using Google
Spreadsheet as the monthly reconciliation and reporting medium.

## Goals

-   Record expenses in under 10 seconds.
-   Accessible from desktop and mobile browsers.
-   Self-hosted frontend.
-   Secure authentication.
-   Spreadsheet available for manual monthly review.

------------------------------------------------------------------------

# 2. Users

-   User A
-   User B

Each user owns their own transactions.

Future: - Shared household expenses.

------------------------------------------------------------------------

# 3. Tech Stack

## Frontend

-   SvelteKit
-   Tailwind CSS
-   shadcn-svelte
-   supabase-js
-   TanStack Query

## Backend

None.

Supabase provides:

-   PostgreSQL
-   Authentication
-   Row Level Security
-   PostgREST
-   Edge Functions

## Reporting

Google Spreadsheet

------------------------------------------------------------------------

# 4. High Level Architecture

``` text
                User
                  │
                  ▼
           SvelteKit Web App
                  │
                  ▼
        Supabase Auth + Postgres
                  │
                  ▼
            Edge Function
                  │
                  ▼
         Google Spreadsheet
```

Source of Truth: PostgreSQL

Reporting: Google Spreadsheet

------------------------------------------------------------------------

# 5. Functional Requirements

## Authentication

-   Email & Password
-   Session persistence
-   Logout

------------------------------------------------------------------------

## Expense

Fields

-   Date
-   Category
-   Amount
-   Description
-   Owner
-   Created At
-   Updated At

Functions

-   Create
-   Edit
-   Delete
-   View history

------------------------------------------------------------------------

## Category

Dynamic master data.

User can

-   Create
-   Update
-   Delete

Examples

-   Food
-   Coffee
-   Transport
-   Bills
-   Entertainment
-   Grocery

------------------------------------------------------------------------

## Dashboard

Display

-   Today's Expense
-   This Month Expense
-   Monthly Trend
-   Expense by Category
-   Recent Transactions

------------------------------------------------------------------------

## Search & Filter

-   Date
-   Category
-   Amount
-   Keyword

------------------------------------------------------------------------

## Reports

-   Monthly Summary
-   Category Breakdown
-   Export CSV

------------------------------------------------------------------------

# 6. Synchronization

Google Spreadsheet is NOT the source of truth.

Flow

``` text
Expense Saved
        │
        ▼
PostgreSQL
        │
        ▼
Edge Function
        │
        ▼
Google Spreadsheet
```

Sync Mode (MVP)

-   Manual "Sync to Spreadsheet"

Future

-   Scheduled sync (every 2 hours)

------------------------------------------------------------------------

# 7. Security

-   Supabase Authentication
-   Row Level Security
-   HTTPS
-   No service_role key exposed
-   Google credentials stored only in Edge Function

------------------------------------------------------------------------

# 8. Database

## expenses

-   id
-   user_id
-   category_id
-   amount
-   description
-   expense_date
-   created_at
-   updated_at

## categories

-   id
-   user_id
-   name
-   icon
-   color
-   created_at

------------------------------------------------------------------------

# 9. Future Roadmap

v1

-   Expense Tracking

v1.1

-   Shared Household

v1.2

-   Budget

v1.3

-   Recurring Expenses

v1.4

-   Income Tracking

v2

-   Asset Tracking
-   Investment Tracking
-   Net Worth Dashboard

------------------------------------------------------------------------

# 10. Out of Scope / Non-Goals (MVP)

The MVP explicitly does NOT support:
-   Offline Mode / PWA sync
-   Multi-Currency conversion (IDR only)
-   OCR Receipt scanning
-   AI automatic categorization
-   Public user registration (Private app for 2 users)
-   Shared household / multi-user groups (Deferred to v1.1)
-   Multi-tenant organizations / Teams
-   Notifications / Push alerts

------------------------------------------------------------------------

# Success Metrics

-   Add expense \< 10 seconds
-   Dashboard \< 500 ms
-   Sync to Spreadsheet \< 30 seconds
-   Zero manual database operations
