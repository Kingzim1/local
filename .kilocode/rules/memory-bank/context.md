# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Ready for development

The template is a clean Next.js 16 starter with TypeScript and Tailwind CSS 4. It's ready for AI-assisted expansion to build any type of application.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Zimax offramp: Polygon to Naira with Access Bank
  - `src/types/offramp.ts` - Type definitions for offramp requests/responses
  - `src/lib/access-bank.ts` - Access Bank API integration for transfers
  - `src/app/api/offramp/route.ts` - Offramp API endpoint
  - `src/app/api/offramp/verify/route.ts` - Account verification endpoint
  - `src/components/OfframpForm.tsx` - React form component with validation

## Current Structure

| File/Directory | Purpose | Status |
|----------------|-----------------|--------|
| `src/app/page.tsx` | Home page with offramp form | ✅ Complete |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/api/offramp/route.ts` | Offramp API endpoint | ✅ Complete |
| `src/app/api/offramp/verify/route.ts` | Account verification API | ✅ Complete |
| `src/components/OfframpForm.tsx` | Offramp form component | ✅ Complete |
| `src/lib/access-bank.ts` | Access Bank integration | ✅ Complete |
| `src/types/offramp.ts` | Type definitions | ✅ Complete |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

The Zimax offramp feature is implemented. The application provides:

1. **OfframpForm** (`src/components/OfframpForm.tsx`) - React form accepting:
   - Polygon wallet address
   - USDC amount
   - Access Bank account number (with verification)

2. **API Routes**:
   - `POST /api/offramp` - Process offramp transactions
   - `GET /api/offramp/verify?accountNumber=X` - Verify Access Bank accounts

3. **Integration**: `src/lib/access-bank.ts` handles Access Bank API calls

**Required Environment Variables** (add to `.env.local`):
```
ACCESS_BANK_API_KEY=your_api_key_here
ACCESS_BANK_CLIENT_KEY=your_client_key_here
ACCESS_BANK_API_URL=https://api.accessbankplc.com
```

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-06-12 | Added Zimax offramp feature (Polygon to Naira via Access Bank) |
