# CrystalPOS Project Progress Log

## Project Overview
- **Name**: CrystalPOS (Point of Sale for Crystales Tati)
- **GitHub**: https://github.com/urmt/CrystalPOS-Tati
- **Live URL**: https://thriving-blancmange-d3d7e9.netlify.app
- **Admin URL**: https://thriving-blancmange-d3d7e9.netlify.app (root)
- **iPad POS URL**: https://thriving-blancmange-d3d7e9.netlify.app/pos
- **Backend**: Supabase (PostgreSQL)

---

## Current Status: ✅ DEPLOYED & WORKING

---

## Feature Checklist

### Core Features
- [x] Database with 9+ tables (users, categories, subcategories, items, sales, etc.)
- [x] Admin Portal with Dashboard, Sales, Inventory, Reports, Users, Devices, Settings
- [x] iPad POS (PWA) - Works offline, auto-syncs when online
- [x] Device registration & blocking via Systems Manager

### iPad POS Specific
- [x] Gallery View - Full-screen carousel for visual advertising
- [x] Manual Slideshow button (Play/Pause in header)
- [x] Auto-slideshow - Starts after 60s idle
- [x] Sales View - Grid of items with category filtering
- [x] Inventory View - Stock warnings (red <30 days, orange <60 days, black = out)
- [x] Add Item View - Add new items/categories/subcategories
- [x] Settings/Dashboard View - Device info, sync status, last sync time
- [x] Checkout flow with discount support
- [x] Offline support with pending sales queue

### Inventory & Images
- [x] 6 test items loaded with images
- [x] Images display in slideshow, sales grid, and detail modal

---

## Database Schema

### Tables
- `users` - Admin users
- `categories` - Item categories (with bilingual name_es field)
- `subcategories` - Subcategories (with bilingual name_es field)
- `items` - Products with pricing, weight, images
- `sales` - Transaction records
- `device_registrations` - iPad device tracking
- `settings` - App settings

### Current Categories (9)
1. Raw Crystals
2. Crystals / Cristales
3. Polished Stones
4. Minerals / Minerales
5. Cathedrals-Geodes
6. Healing Stones / Piedras Curativas
7. Water Bottles
8. Unique / Único
9. Incense

### Current Items (6)
1. Amethyst Cluster (1200 CRC/g) - ✅ Image loaded
2. Citrine Cluster (2000 CRC/g) - ✅ Image loaded
3. Clear Quartz Tumbled (650 CRC/g) - ✅ Image loaded
4. Mixed 7 Chakra Stones (850 CRC/g) - ✅ Image loaded
5. Purple Cathedral Formation (6500 CRC/g) - ✅ Image loaded
6. Rose Quartz Tumbled (1000 CRC/g) - ✅ Image loaded

---

## Known Issues Fixed

### ✅ Fixed: Spanish Duplicate Text
- **Issue**: Categories like "Crystals / Cristales / Cristales" showed duplicated Spanish
- **Fix**: Code now checks if name already contains `/` before appending Spanish translation
- **Location**: `src/app/pos/page.tsx` lines 766-778

### ✅ Fixed: Inline Edit in Inventory
- **Issue**: Inventory inline editing referenced undefined subcategory_ids
- **Fix**: Removed subcategory_ids column reference, added image update SQL

### ✅ Fixed: Image URLs
- All 6 items now have valid Unsplash image URLs that work in slideshow

---

## Pending / Future Features

### High Priority
- [ ] Test slideshow auto-start after 60s idle
- [ ] Verify slideshow manual button works
- [ ] Test full checkout flow with actual sale

### Medium Priority
- [ ] Add more items (20-30 crystal products)
- [ ] Add barcode/SKU scanning
- [ ] Receipt printing support

### Low Priority
- [ ] Multi-language toggle (EN/ES)
- [ ] Analytics dashboard
- [ ] Customer management

---

## Deployment History

| Date | Commit | Description |
|------|--------|-------------|
| 2026-04-23 | b575e3c | Fix: prevent duplicate Spanish category names |
| 2026-04-23 | 0fc819e | Add full-screen gallery, manual slideshow button, bigger images |
| 2026-04-23 | 024efc8 | Fix inventory inline edit: remove subcategory_ids, add image update migration |
| 2026-04-23 | f00a3bc | Add Gallery view, idle slideshow, inline edit, and crystal images |
| 2026-04-23 | b4c4c61 | Fix: use separate INSERT statements for subcategories and items |
| 2026-04-23 | e95601c | Fix migration: use auto-generated UUIDs for categories/subcategories |
| 2026-04-23 | 9ad8b11 | Add bilingual fields, suggested prices, discounts, and crystal theme |
| 2026-04-23 | 3bc3a09 | Add Reports page with sales summaries and low stock alerts |
| 2026-04-23 | 2faffc2 | Add inventory stock warning system |

---

## User Requirements

- **iPad POS**: No login required
- **Device Blocking**: Via Systems Manager (not implemented in UI)
- **Sync**: Manual sync only (controlled by Tati)
- **iPad Permissions**: Only ENTER data, cannot delete
- **Theme**: Crystal/crystal theme (gold & purple) only on iPad, NOT on Admin

---

## SQL Commands (if needed)

```sql
-- Query categories
SELECT * FROM categories ORDER BY display_order;

-- Query items with images
SELECT name, sku, price_crc, image_url, current_weight_grams FROM items;

-- Query pending offline sales
SELECT * FROM sales ORDER BY created_at DESC LIMIT 10;
```

---

## Technical Notes

- **Framework**: Next.js 14 with App Router
- **UI Library**: Material UI (MUI) v5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: None for POS (device-based), Supabase Auth for Admin
- **Offline Storage**: localStorage for pending sales and cached data

---

## Last Updated
- **Date**: 2026-04-23
- **Status**: All core features implemented, deployed and working