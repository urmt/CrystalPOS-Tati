# CrystalPOS — Technical Documentation

**Project:** Crystal Market Custom POS System  
**Status:** In Development  
**Last Updated:** April 15, 2026

---

## TABLE OF CONTENTS

1. [Project Overview & Goals](#1-project-overview--goals)
2. [Best Practices](#2-best-practices)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Database Schema](#5-database-schema)
6. [Project Status](#6-project-status)
7. [Error Logging](#7-error-logging)
8. [Folder Structure](#8-folder-structure)
9. [Quick Reference](#9-quick-reference)

---

## 1. PROJECT OVERVIEW & GOALS

### 1.1 Core Mission
Build a beautiful, powerful, offline-first POS system for selling crystals, minerals, water bottles, and incense.

### 1.2 Key Objectives

| Objective | Priority | Status |
|-----------|----------|--------|
| Offline-first iPad app | Critical | Pending |
| Gram-based inventory tracking | Critical | Pending |
| Supabase backend (free tier) | Critical | Pending |
| SINPE Móvil payment support | High | Pending |
| Lightning Network (Bitcoin) | High | Pending |
| Admin HTML portal | High | Pending |
| Real-time reporting | Medium | Pending |

### 1.3 Users

- **Vendor Manager:** Uses iPad app for sales + inventory
- **Systems Manager (Admin):** Uses web portal for full oversight

### 1.4 Success Metrics

- [ ] iPad connects to Supabase
- [ ] First sale recorded offline
- [ ] First sync successful
- [ ] Admin portal shows sale
- [ ] 50+ sales recorded
- [ ] Zero sync failures
- [ ] Offline mode tested

---

## 2. BEST PRACTICES

### 2.1 Code Comments (MANDATORY)

**ALWAYS add comments in:**
- Every function/method
- Complex logic blocks
- API calls and data transformations
- Database queries
- Error handling code
- Any non-obvious code

**Comment Format:**
```javascript
// =============================================================================
// COMMENT: Describe what this code does and WHY
// =============================================================================
```

**Example Good Comments:**
```javascript
// =============================================================================
// calculateItemPrice: Calculates price based on weight in grams
// Price = base price per gram × weight. Rounds to nearest 50 CRC.
// Params: itemPricePerGram (number), weightInGrams (number)
// Returns: calculated price in CRC
// =============================================================================
```

### 2.2 Error Handling (MANDATORY)

**ALWAYS use:**
- Try-catch blocks for ALL async operations
- Meaningful error messages (not just "Error occurred")
- Error logging functions
- User-friendly error messages
- Error boundaries in React components

**Error Logging Pattern:**
```javascript
// =============================================================================
// logError: Centralized error logging function
// Logs error with timestamp, error type, message, stack trace
// Used for debugging and monitoring
// =============================================================================
const logError = (errorType, errorMessage, stackTrace = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    errorType,
    errorMessage,
    stackTrace,
    // Add context here (user ID, current screen, etc.)
  };
  console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
  // TODO: Send to error tracking service (e.g., Sentry)
  return logEntry;
};
```

### 2.3 TypeScript Types (REQUIRED)

- Define interfaces for all data structures
- Use strict typing everywhere
- Export types for reuse across components

---

## 3. TECH STACK

### 3.1 Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Database | Supabase (PostgreSQL) | Free tier |
| Auth | Supabase Auth | Latest |
| Real-time | Supabase Realtime | Latest |
| Sync | WatermelonDB | Latest |

### 3.2 iPad App

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native + Expo | Latest |
| Local DB | WatermelonDB + SQLite | Latest |
| State | Redux Toolkit | Latest |
| UI | React Native Paper | Latest |
| Charts | react-native-chart-kit | Latest |
| Navigation | React Navigation | Latest |

### 3.3 Admin Portal

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js 14 | Latest |
| UI | Shadcn/ui + TailwindCSS | Latest |
| Auth | Supabase Auth | Latest |
| Charts | Recharts | Latest |
| Tables | TanStack Table | Latest |
| Hosting | Vercel | Free tier |

---

## 4. ARCHITECTURE

### 4.1 System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CRYSTAL MARKET POS                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  iPad App (Vendor Manager)        HTML Portal (Admin)       │
│  ├─ Sales UI                  ├─ Dashboard                  │
│  ├─ Inventory Mgmt           ├─ User Management            │
│  ├─ Create Items             ├─ Reports                   │
│  ├─ Local SQLite DB          ├─ Audit Logs                │
│  └─ Offline Mode            └─ System Settings            │
│                                                               │
│         ↕ Syncs via API ↕                                   │
│                                                               │
│  Backend (Supabase — FREE)                                  │
│  ├─ PostgreSQL Database                                    │
│  ├─ Real-time Subscriptions                               │
│  ├─ Authentication                                         │
│  └─ Row-Level Security (RLS)                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Sync Flow

```
[OFFLINE on iPad]
  ↓ Vendor sells crystal
  ↓ Sale recorded to local SQLite immediately
  ↓ User can keep selling (no internet needed)

[Internet returns]
  ↓ WatermelonDB detects connection
  ↓ Pulls changes from Supabase (admin updates?)
  ↓ Pushes local sales to Supabase
  ↓ Supabase resolves conflicts (local data wins)
  ↓ Sync complete — everything in sync
```

### 4.3 Conflict Resolution Strategy

- **Local always wins** if Vendor Manager and Admin edit same item
- Conflicts logged to audit trail
- Sync is idempotent (safe to retry)
- Timestamps track prevent duplicates

---

## 5. DATABASE SCHEMA

### 5.1 Core Tables

```sql
-- =============================================================================
-- USERS & AUTH
-- Stores user accounts with role-based access
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'vendor_manager')) DEFAULT 'vendor_manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- CATEGORIES
-- Top-level categories: Crystals, Minerals, Water Bottles, Incense
-- =============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SUBCATEGORIES
-- Subcategories within each category
-- =============================================================================
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ITEMS (Products)
-- Individual items for sale with gram-based tracking
-- =============================================================================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  description TEXT,
  price_crc NUMERIC NOT NULL,
  current_weight_grams NUMERIC NOT NULL DEFAULT 0,
  min_threshold_grams NUMERIC DEFAULT 100,
  depletion_rate_grams_per_day NUMERIC DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete timestamp
);

-- =============================================================================
-- INVENTORY TRANSACTIONS
-- Track all inventory changes (sales, restocks, adjustments)
-- =============================================================================
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('sale', 'restock', 'adjustment')),
  quantity_grams NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- SALES
-- Record of all sales transactions
-- =============================================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items_sold JSONB NOT NULL,  -- Array of { item_id, qty_grams, price }
  subtotal_crc NUMERIC NOT NULL,
  tax_crc NUMERIC DEFAULT 0,
  total_crc NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('sinpe', 'card', 'cash', 'lightning')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  lightning_invoice_id TEXT,
  notes TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,  -- WatermelonDB sync timestamp
  server_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- BOOKKEEPING
-- Income and expense tracking
-- =============================================================================
CREATE TABLE bookkeeping_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT CHECK (entry_type IN ('income', 'expense')),
  amount_crc NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- DAILY REPORTS
-- Pre-calculated daily summaries
-- =============================================================================
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE UNIQUE NOT NULL,
  total_sales_crc NUMERIC DEFAULT 0,
  num_transactions INTEGER DEFAULT 0,
  items_sold JSONB,  -- Summary of what sold
  payment_breakdown JSONB,  -- { sinpe: X, cash: Y, lightning: Z }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS
-- Track all changes for compliance
-- =============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Row-Level Security (RLS)

```sql
-- =============================================================================
-- RLS: Enable row-level security on all tables
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeping_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policy: Users can read all, admins can do everything
-- =============================================================================
CREATE POLICY "Allow all access for authenticated users"
ON users FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
```

---

## 6. PROJECT STATUS

### 6.1 Overall Status

| Milestone | Status | Notes |
|----------|--------|-------|
| Research & Planning | ✅ Complete | This document |
| Backend Setup | ⏳ Pending | Supabase schema |
| iPad App Frontend | ⏳ Pending | React Native + Expo |
| Payment Integrations | ⏳ Pending | SINPE, Lightning |
| Offline Sync | ⏳ Pending | WatermelonDB |
| Admin Portal | ⏳ Pending | Next.js |
| Polish & Testing | ⏳ Pending | Edge cases |
| Deployment | ⏳ Pending | TestFlight + Vercel |

### 6.2 Tasks

| ID | Task | Status | Priority |
|----|------|--------|----------|
| 1 | Create CrystalPOS.md | ✅ Done | High |
| 2 | Project folder structure | ⏳ Pending | High |
| 3 | Supabase schema | ⏳ Pending | High |
| 4 | iPad app setup | ⏳ Pending | High |
| 5 | Admin portal setup | ⏳ Pending | High |

---

## 7. ERROR LOGGING

### 7.1 Error Categories

| Category | Code Prefix | Description |
|----------|-------------|-------------|
| DATABASE | DB_ | Database errors |
| AUTH | AUTH_ | Authentication errors |
| SYNC | SYNC_ | Sync/connection errors |
| PAYMENT | PMT_ | Payment processing errors |
| VALIDATION | VAL_ | Input validation errors |
| NETWORK | NET_ | Network request errors |
| UI | UI_ | UI/component errors |

### 7.2 Error Logging Function

```javascript
// =============================================================================
// createErrorLog: Creates structured error log entry
// Used for debugging and monitoring across the application
// 
// params:
//   - category: Error category code (e.g., 'DB_', 'AUTH_')
//   - message: Human-readable error message
//   - context: Additional context (current user, screen, etc.)
//   - error: Original Error object (optional)
// 
// returns: Structured log entry object
// =============================================================================
const createErrorLog = (category, message, context = {}, error = null) => {
  const logEntry = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    category: category,
    message: message,
    context: context,
    stack: error?.stack || null,
    userAgent: navigator?.userAgent || 'unknown',
    // Add more context as needed
  };
  
  // Log to console
  console.error(`[${category}] ${message}`, logEntry);
  
  // TODO: Send to error tracking service
  // Example: Sentry.captureException(error, { extra: context });
  
  return logEntry;
};
```

### 7.3 Try-Catch Wrapper

```javascript
// =============================================================================
// withErrorHandling: Wrapper for async functions with error handling
// 
// usage:
//   const result = await withErrorHandling(
//     () => someAsyncFunction(),
//     'AUTH_001',
//     'Failed to login user'
//   );
// =============================================================================
const withErrorHandling = async (fn, errorCode, errorMessage) => {
  try {
    return await fn();
  } catch (error) {
    logError(errorCode, errorMessage, { originalError: error.message });
    throw error;
  }
};
```

---

## 8. FOLDER STRUCTURE

### 8.1 Project Root

```
CrystalPOS-Tati/
├── docs/
│   └── CrystalPOS.md              # This documentation
├── backend/
│   └── supabase/
│       ├── migrations/            # Database migrations
│       ├── functions/            # Edge functions
│       └── seed-data/            # Sample data
├── ipad-app/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── screens/             # Screen components
│   │   ├── database/           # WatermelonDB setup
│   │   ├── api/                # API calls
│   │   ├── store/              # Redux store
│   │   ├── utils/              # Utility functions
│   │   ├── hooks/              # Custom hooks
│   │   └── types/              # TypeScript types
│   ├── App.tsx
│   └── package.json
├── admin-portal/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── lib/                # Supabase client
│   │   ├── hooks/              # Custom hooks
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── next.config.js
└── README.md
```

### 8.2 File Naming Conventions

- **Components:** `PascalCase` (e.g., `SalesScreen.tsx`)
- **Utilities:** `camelCase` (e.g., `errorLogger.ts`)
- **Types:** `PascalCase` with `.types.ts` suffix (e.g., `User.types.ts`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `API_ENDPOINTS.ts`)
- **Styles:** Follow component naming (e.g., `SalesScreen.styles.ts`)

---

## 9. QUICK REFERENCE

### 9.1 API Endpoints

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/items` | GET/POST | List/Create items |
| `/api/items/:id` | GET/PUT/DELETE | Item operations |
| `/api/sales` | GET/POST | List/Create sales |
| `/api/categories` | GET/POST | List/Create categories |
| `/api/reports/daily` | GET | Daily report |

### 9.2 Payment Methods

| Method | Code | Description |
|--------|------|-------------|
| SINPE Móvil | `sinpe` | Costa Rica mobile payment |
| Lightning | `lightning` | Bitcoin Lightning |
| Card | `card` | Credit/Debit card |
| Cash | `cash` | Manual cash |

### 9.3 User Roles

| Role | Access Level |
|------|--------------|
| `admin` | Full access (Systems Manager) |
| `vendor_manager` | Sales + Inventory (Vendor Manager) |

### 9.4 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6B4C9A` | Deep purple - mystical |
| Secondary | `#D4AF37` | Rose gold - luxury |
| Accent | `#20B2AA` | Teal - balance |
| Text | `#333333` | Dark gray |
| Background | `#F7F5F3` | Off-white |

---

## 10. DEPLOYMENT CHECKLIST

### 10.1 Pre-Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] Types checked
- [ ] Lint passing

### 10.2 Deployment Steps

1. **Backend (Supabase)**
   - [ ] Run migrations in production
   - [ ] Configure RLS policies
   - [ ] Seed test data
   - [ ] Test API endpoints

2. **iPad App**
   - [ ] Build for iOS
   - [ ] Test on iPad
   - [ ] Test offline mode
   - [ ] Test syncing

3. **Admin Portal**
   - [ ] Deploy to Vercel
   - [ ] Configure environment variables
   - [ ] Test authentication
   - [ ] Test all pages

---

## 11. TROUBLESHOOTING

### 11.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Sync fails | Network timeout | Check connection, retry sync |
| Login fails | Invalid credentials | Reset password |
| Sale won't save | Offline mode | Verify local save first |
| Payment fails | Payment provider | Try cash fallback |

### 11.2 Debug Commands

```bash
# Check sync status
curl -X GET https://your-supabase-url/rest/v1/sales?synced_at=is.null

# View recent errors
tail -100 error.log

# Check database connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity"
```

---

## 12. CONTACTS

| Role | Responsibility |
|------|----------------|
| Systems Manager | Admin portal, settings, all data |
| Vendor Manager | iPad sales, inventory management |

---

## 13. REFERENCES

- [Supabase Docs](https://supabase.com/docs)
- [WatermelonDB Docs](https://watermelondb.dev)
- [React Native Paper](https://reactnativepaper.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Kushki Docs](https://docs.kushki.com)

---

*Document Version: 1.0*  
*Auto-generated for CrystalPOS Project*