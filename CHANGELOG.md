# Changelog

## v2.0.0 (2026-06-03)

### Breaking Changes
- Bumped all packages to v2.0.0 (client, server)
- Removed `useSyncExternalStore` from all context providers to fix persistent hydration errors

### Features
- **PWA Support**: Added `manifest.ts` for installable web app with icons, theme color, and standalone display
- **i18n Expansion**: Added 40+ translation keys covering landing page features, history stats, profile edit form, admin queue management, analytics health status, ticket confirmation, login/register, and category filters
- **Arabic Translation Parity**: All new English keys translated to Arabic with correct RTL handling
- **Custom 404 Page**: Added `not-found.tsx` with branded styling
- **Error Boundary**: Added `error.tsx` with retry button
- **Sitemap**: Updated with all 12 routes (history, profile, settings, admin, etc.)
- **Loading Skeletons**: History page shows animated skeleton cards while fetching data

### Fixes
- **Hydration Error #418 & #444**: Removed `isMounted` wrappers and `useSyncExternalStore` that caused server/client DOM mismatch. Context providers now initialize with consistent SSR-safe defaults and hydrate from localStorage via `useEffect`
- **Backend 500 on `/api/tickets/my`**: Fixed Supabase join chain — `tickets` → `queues` → `businesses` (was `tickets` → `businesses` with no FK)
- **Backend Error Leak**: PATCH `/api/businesses/:id` no longer exposes raw database error messages
- **Build Error**: Fixed unterminated `className` string in `history/page.tsx:81`
- **Settings Toggle**: Adjusted proportions from `w-11 h-6` (zero breathing room) to `w-11 h-7` (2px gap)
- **Queue Page**: Added missing `dir={dir}` prop to outer div
- **Robots.txt**: Fixed domain from `queueless.vercel.app` to `queue-less-nu.vercel.app`
- **Duplicate Files**: Removed `logo512x512 .webp` and `webcon .png` (trailing spaces caused file duplication)
- **History Navigation**: Entire card now links to ticket page; "Again" button uses `stopPropagation`

### Refactors
- **ThemeLangToggle**: Standardized as self-contained component with `bg-white` container and `text-black` buttons for proper contrast. Removed all page-specific CSS overrides (6 files: home, history, profile, admin, admin/queue, admin/analytics)
- **Landing Page**: Replaced all `locale === "ar"` hardcoded ternaries with `t()` function calls
- **Landing Page Portrait**: Added `pt-20` to prevent "Less" text from hiding behind fixed toggle
- **Consistent Card Styling**: Added `shadow-sm` base + `shadow-lg` hover to cards across home, history, admin, and queue pages
- **Queue Toggle**: Standardized notify toggle to match Settings Toggle component (`w-11 h-7`, `p-0.5`, `aria-pressed`, RTL-aware)
- **Updated 6 pages** to use `t()` instead of hardcoded English strings (login, register, settings, profile, admin queue, ticket confirm)

### SEO
- Root layout: added `title.template` with `"%s | QueueLess"` format
- Added `metadataBase`, `robots`, `openGraph`, `twitter` metadata to root layout
- Added `hreflang` support via updated root layout metadata

### Chores
- Removed unused `dir` prop from settings Toggle component
- Removed `className="q"` typo on home page
- Removed `[&_button]:bg-white/20` style leak from history page header

## v1.0.0 (Initial Release)
- Initial project setup with Next.js, Express, Socket.IO, PostgreSQL
- Basic queue management, real-time updates, multi-language support
- Admin dashboard with analytics
