<h1>
  <img src="client/public/logo-rm.webp" alt="QueueLess" width="132" height="132" style="vertical-align: middle; margin-right: 6px; border-radius: 8px;">
  QueueLess
</h1>

Smart Queue & Appointment System — Eliminate physical waiting lines with a real-time digital queue system. Join remotely, track your turn live, and save hours of time.

<p>
  <img src="https://img.shields.io/badge/Next_16-000000?logo=next.js&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white" alt="Socket.IO">
  <img src="https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/i18n-EN_%2F_AR-ec4899" alt="i18n">
</p>

---

## Features

| Feature | Description |
|---|---|
| **Real-time Queue Updates** | WebSocket-powered live ticket progress and service alerts via Socket.IO |
| **Wait-Time Engine** | Background jobs compute estimated wait times from live service averages |
| **Future Scheduling** | Book appointments on upcoming dates based on business operating schedules |
| **8 Queue Types** | Join queues for clinics, banks, restaurants, government offices, and more |
| **Multi-lingual** | Full English & Arabic (RTL) with instant language toggle |
| **Dark Mode** | Light/Dark theme with persisted preference |
| **Admin Dashboard** | Real-time queue control, call next, skip, no-show, and analytics |
| **PWA** | Installable web app with manifest and offline support |
| **Responsive** | Mobile-first with bottom nav and desktop sidebar |
| **Live Notifications** | Push alerts for approaching turn, queue status changes |

## Tech Stack

| Layer | Library |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [TanStack Query](https://tanstack.com/query) |
| **Backend** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.IO](https://socket.io/) (real-time), [node-cron](https://www.npmjs.com/package/node-cron) (background jobs) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) |
| **Auth** | JWT-based with Supabase Auth |
| **State** | React Context API + custom hooks |
| **i18n** | Custom lightweight EN/AR system with RTL support |
| **Fonts** | [Geist](https://vercel.com/font), [Cairo](https://fonts.google.com/specimen/Cairo) (Arabic) |

## Structure

```
QueueLess/
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── admin/       # Admin dashboard, queue mgmt, analytics
│   │   │   ├── home/        # Customer dashboard
│   │   │   ├── queue/[id]/  # Join & track queue
│   │   │   ├── ticket/[id]/ # Ticket confirmation
│   │   │   ├── history/     # Past tickets
│   │   │   ├── profile/     # User profile
│   │   │   ├── settings/    # Theme & language
│   │   │   ├── login/       # Authentication
│   │   │   └── register/    # Registration
│   │   ├── components/      # Shared components
│   │   ├── context/         # Auth, Theme, Language providers
│   │   ├── hooks/           # useTranslation
│   │   ├── lib/             # API client, Supabase config
│   │   └── locales/         # EN/AR translations
│   └── public/              # Static assets
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # Auth, businesses, queues, tickets, notifications
│   │   ├── middleware/      # Auth middleware
│   │   ├── jobs/            # Background notifier
│   │   ├── sockets/         # Socket.IO event handlers
│   │   └── lib/             # Supabase client
│   └── db/                  # Schema, seeds, migrations
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** v18+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
git clone https://github.com/Omar-Khaled-57/QueueLess.git
cd QueueLess

# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Environment

**Backend** (`server/.env`):
```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:3000
```

**Frontend** (`client/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Database

Run the schema against your Supabase project:
- `server/db/schema.sql` — core tables
- `server/db/seed_supabase.ts` — mock data

```bash
cd server
npm run seed
```

### Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Online Demo

| Service | URL |
|---|---|
| **Frontend** | [queue-less-nu.vercel.app](https://queue-less-nu.vercel.app) |
| **Backend** | `queueless-production-9faa.up.railway.app` |

### Test Accounts

All accounts use password: `password123`

**Business Administrators** (access `/admin`):

| Name | Email | Business |
|---|---|---|
| Uncle Johnny | abu@koshary.com | Big Koshary Time! |
| John Rabbit | rabie@clinic.com | Dr. Rabbioid Clinic |
| Jouhn Zenin | afaf@mogamma.gov.eg | The Bureau of Stamps |

**Regular Customers** (access `/home`): `bassem@user.com`, `helmy@user.com`, `mona@user.com`, `mo@user.com`

### Navigation Flow

1. **Landing** (`/`) — Feature grid, get started / sign in
2. **Login/Register** — Create account or use mock accounts
3. **Customer Dashboard** (`/home`) — Browse businesses by category, search, join queues
4. **Queue Page** (`/queue/[id]`) — Live queue, join with date selection, track position
5. **Ticket** (`/ticket/[id]`) — Ticket details with QR-like code
6. **History** (`/history`) — Past tickets with status, wait times, re-join
7. **Profile** (`/profile`) — Edit name/phone/city/address, avatar, notifications
8. **Settings** (`/settings`) — Theme toggle, language toggle, notification prefs
9. **Admin Dashboard** (`/admin`) — Queue control, call next, skip, no-show
10. **Admin Queue Mgmt** (`/admin/queue`) — Create/close queues, monitor live
11. **Admin Analytics** (`/admin/analytics`) — Peak hours, weekly trends, health score

## Architecture

- **Real-time**: Socket.IO broadcasts `queue:update` events; frontend joins per-queue rooms
- **Background Jobs**: `node-cron` checks for upcoming appointments and sends notifications
- **Notifications**: `notified_events` table prevents duplicate alerts
- **Auth**: JWT-based with protected routes; Supabase for user management
- **Error Handling**: Custom 404 page, error boundary with retry, no raw DB leaks

## License

[MIT](LICENSE) © [Omar Khaled](https://github.com/Omar-Khaled-57)
