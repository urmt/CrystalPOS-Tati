# CrystalPOS - Crystal Market Custom POS System

A beautiful, powerful, offline-first POS system for selling crystals, minerals, water bottles, and incense.

## Project Status

**Status:** In Development  
**Last Updated:** April 15, 2026

## Quick Start

### Prerequisites

1. Node.js 18+
2. Supabase account (free tier)
3. React Native + Expo (for iPad app)
4. Next.js (for admin portal)

### Setup

1. Clone the repository
2. Create `.env` files based on examples
3. Run migrations in Supabase
4. Install dependencies and start developing

### Project Structure

```
CrystalPOS-Tati/
├── CrystalPOS.md           # Main documentation
├── PROJECT_STATUS.md    # Project status tracking
├── backend/           # Backend (Supabase)
│   └── supabase/
│       ├── migrations/
│       ├── functions/
│       └── seed-data/
├── ipad-app/         # iPad app (React Native + Expo)
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── database/
│   │   ├── api/
│   │   ├── store/
│   │   └── utils/
│   └── App.tsx
└── admin-portal/     # Admin portal (Next.js)
    └── src/
        ├── components/
        ├── pages/
        ├── lib/
        └── hooks/
```

## Technology Stack

- **Backend:** Supabase (PostgreSQL)
- **iPad App:** React Native + Expo + WatermelonDB
- **Admin Portal:** Next.js 14 + TailwindCSS
- **Payments:** SINPE Móvil, Lightning Network, Card, Cash

## Documentation

See [CrystalPOS.md](CrystalPOS.md) for complete technical documentation.

## License

Proprietary - Crystal Market