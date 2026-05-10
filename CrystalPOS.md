# CrystalPOS — Technical Documentation & Project Log

**Project:** Crystal Market Custom POS System  
**Status:** ✅ DEPLOYED & WORKING  
**Last Updated:** May 9, 2026

---

## 1. PROJECT OVERVIEW & GOALS

### 1.1 Core Mission
Build a beautiful, powerful, offline-first POS system for selling crystals, minerals, water bottles, and incense.

### 1.2 Access URLs
- **Admin Portal**: [melodic-baklava-327e68.netlify.app](https://melodic-baklava-327e68.netlify.app)
- **iPad POS**: [melodic-baklava-327e68.netlify.app/pos](https://melodic-baklava-327e68.netlify.app/pos)

### 1.3 Key Objectives Status
- [x] iPad connects to Supabase
- [x] First sale recorded offline
- [x] First sync successful
- [x] Admin portal shows sale
- [x] 50+ sales recorded
- [x] Zero sync failures
- [x] Offline mode tested

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Tech Stack
- **Framework**: Next.js 14 with App Router
- **UI Library**: Material UI (MUI) v6
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Hooks + LocalStorage (for offline sales)
- **Styling**: Crystal theme (Gold #D4AF37 & Purple #6B4C9A)

### 2.2 Core Components
- **iPad POS (PWA)**: Optimized for touch, offline support, auto-sync.
- **Admin Portal**: Real-time reporting, inventory management, user oversight.
- **Systems Manager**: Device registration and security.

---

## 3. FEATURE CHECKLIST

### 3.1 iPad POS Specific
- [x] **Gallery View**: Full-screen carousel for visual advertising.
- [x] **Auto-slideshow**: Starts after 60s idle.
- [x] **Sales View**: Grid of items with category filtering.
- [x] **Cart Management**: Manual price overrides, per-item discounts.
- [x] **Offline Support**: Pending sales queue with auto-sync.
- [x] **WhatsApp Receipt**: Customer phone/name saving and receipt sending.

### 3.2 Admin Features
- [x] **Dashboard**: Sales summaries and real-time metrics.
- [x] **Inventory**: CRUD operations with stock depletion tracking.
- [x] **Reports**: Payment breakdown, inventory valuation, sales detail.
- [x] **Customers**: Automated catalog generation from sales.
- [x] **Users & Devices**: Management of portal access and iPad registration.

---

## 4. INPUT REQUIREMENTS (iPad Optimization)

Due to iPad hardware constraints, all inputs must use **Popup Keypads**:
1. **Numbers**: Use custom NUMBER PAD popup for prices, weights, and overrides.
2. **Phone**: Use NUMBER PAD with country code selector.
3. **Names**: Use Text Input dialogs rather than triggering the native keyboard.

---

## 5. DATABASE SCHEMA SUMMARY

### Tables
- `users`: Admin portal accounts.
- `categories`: Bilingual (EN/ES) product categories.
- `items`: Products with pricing (CRC/g), images, and weight tracking.
- `sales`: Transaction records including `items_sold` JSONB.
- `customers`: Auto-populated from sale data.
- `device_registrations`: iPad tracking and blocking.
- `settings`: Global app configuration.

---

## 6. DEVELOPMENT & MAINTENANCE

### Quick Commands
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run code quality checks.

### Best Practices
- **Surgical Changes**: Match existing style, avoid nearby refactors.
- **Simplicity First**: Minimum viable code, avoid speculative abstractions.
- **Error Handling**: Mandatory try-catch on all async operations.
- **Documentation**: Keep this file updated as the single source of truth.

---
*Document Version: 2.0 (Consolidated)*
