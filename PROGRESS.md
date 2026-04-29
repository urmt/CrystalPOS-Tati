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

## FIELD INPUT REQUIREMENTS (IMPORTANT)

### All Input Fields Must Use Popup Keypads
Due to iPad having no keyboard, ALL text/number input fields must use popup keypads:

1. **Numbers (prices, weights, discount overrides)**: Use NUMBER PAD popup
2. **Phone numbers**: Use NUMBER PAD popup  
3. **Customer names**: Use TEXT INPUT popup/dialog
4. **Any Text Input**: Must NOT use native keyboard - use dialogs/keypads

### Implementation Pattern
```jsx
// WRONG - triggers native keyboard
<TextField value={value} onChange={(e) => setValue(e.target.value)} />

// CORRECT - uses popup keypad
<Box onClick={() => openKeypad()} sx={{ p: 1, border: '1px solid #ccc' }}>
  {value || 'Tap to enter...'}
</Box>
<Dialog open={keypadOpen} onClose={() => setKeypadOpen(false)}>
  {/* Number pad buttons */}
</Dialog>
```

### Fields That Need Popup Keypads
- [x] Cart item prices (manual price override)
- [x] Final total override
- [x] Customer phone number
- [ ] Customer name (in progress)
- [x] Discount percentages (can use buttons)

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
- [x] Auto-slideshow - Starts after 60s idle, navigates to gallery
- [x] Sales View - Grid of items with category filtering
- [x] Cart View - Full cart management with discounts
- [x] Inventory View - Stock warnings (red <30 days, orange <60 days, black = out)
- [x] Add Item View - Add new items/categories/subcategories
- [x] Settings/Dashboard View - Device info, today's sales report, sync status
- [x] Checkout flow with discount support
- [x] Offline support with pending sales queue
- [x] WhatsApp Receipt - Customer can enter phone/name, receipt sent

### Customer Features
- [x] Customer phone input with country codes (+1, +52, +506, +57, +58, +54, +55, +39, +33, +34, +49, +31, +Other)
- [x] Customer name input (optional)
- [x] Customers saved to database automatically on sale
- [x] Customer catalog in Admin (Customers page)

### Cart Features
- [x] Per-item discount buttons (0%, 5%, 10%, 15%, 20%, 25%, 50%)
- [x] Per-item manual price override ( TOTAL price, not per-unit)
- [x] Cart-wide discount percentage
- [x] Final total manual override
- [x] Quantity adjustment (+/-)

### Admin Features
- [x] Dashboard with sales summaries
- [x] Sales history
- [x] Inventory management
- [x] Reports
- [x] Customers catalog with search and CSV export
- [x] Users management
- [x] Devices management
- [x] Settings

---

## Database Schema

### Tables
- `users` - Admin users
- `categories` - Item categories (with bilingual name_es field)
- `subcategories` - Subcategories (with bilingual name_es field)
- `items` - Products with pricing, weight, images
- `sales` - Transaction records
- `customers` - Customer catalog
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

### ✅ Fixed: Customer Database Not Saving
- **Issue**: Customer phone/name not saving to database- **Fix**: Added customer lookup/insert logic in createSale function, saves to customers table

### ✅ Fixed: Input Fields Need Popup Keypads
- **Issue**: Native keyboard doesn't work on iPad- **Fix**: All number inputs now use popup number pad dialog- **Location**: Used for price, phone, final total inputs

---

## Pending / Future Features

### High Priority
- [x] Test slideshow auto-start after 60s idle
- [x] Verify slideshow manual button works
- [x] Test full checkout flow with actual sale
- [x] WhatsApp receipt system (customer phone/name saving)
- [x] Customer catalog in Admin

### Medium Priority
- [ ] Add more items (20-30 crystal products)
- [ ] Add barcode/SKU scanning
- [ ] Receipt printing support

### Low Priority
- [ ] Multi-language toggle (EN/ES)
- [ ] Analytics dashboard

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