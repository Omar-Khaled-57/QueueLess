# QueueLess

> Smart Queue & Appointment System — Eliminate physical waiting lines with a real-time digital queue system. Join remotely, track your turn live, and save hours of time.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion
- **Backend**: Node.js, Express, Socket.IO (real-time), node-cron (background jobs)
- **Database**: PostgreSQL via Supabase
- **State Management**: React Context API + Custom Hooks
- **i18n**: Custom lightweight system (EN/AR with RTL support)

---

## Features

- **Real-time Queue Updates**: WebSocket-powered live ticket progress and service alerts
- **Intelligent Wait-Time Engine**: Background jobs compute estimated wait times from live service averages
- **Future Date Scheduling**: Book appointments on upcoming dates based on business operating schedules
- **Multi-lingual & Themed**: Full English/Arabic (RTL) support + Light/Dark mode
- **Admin Command Center**: Real-time analytics, queue control (call next, skip), business management
- **PWA Ready**: Installable web app with manifest, icons, and offline support
- **Responsive Design**: Mobile-first layout with portrait/landscape optimization

---

## Local Demonstration

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd QueueLess

   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

2. **Configure environment**

   Backend (`server/.env`):
   ```env
   PORT=4000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   CLIENT_URL=http://localhost:3000
   ```

   Frontend (`client/.env`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

3. **Run database migrations**

   Execute the schema against your Supabase project (via SQL editor or migration tool):
   - `server/db/schema.sql` — core tables
   - `server/db/seed_egypt.sql` — mock data (users, businesses, queues)

4. **Start the application**

   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

---

## Online Demonstration

The application is deployed at:

| Service   | URL                                                              |
|-----------|------------------------------------------------------------------|
| Frontend  | [queue-less-nu.vercel.app](https://queue-less-nu.vercel.app)     |
| Backend   | `queueless-production-9faa.up.railway.app`                       |

### Test Accounts

All accounts use password: `password123`

**Business Administrators** (access `/admin`):

| Name            | Email               | Business              |
|-----------------|---------------------|-----------------------|
| Uncle Johnny    | abu@koshary.com     | Big Koshary Time!     |
| John Rabbit     | rabie@clinic.com    | Dr. Rabbioid Clinic   |
| Jouhn Zenin     | afaf@mogamma.gov.eg | The Bureau of Stamps   |

**Regular Customers** (access `/home`):

| Email              |
|--------------------|
| bassem@user.com    |
| helmy@user.com     |
| mona@user.com      |
| mo@user.com        |

### Navigation Flow

1. **Landing Page** (`/`) — Overview with feature grid, get started / sign in
2. **Login/Register** — Create account or use mock accounts above
3. **Customer Dashboard** (`/home`) — Browse businesses by category, search, join queues
4. **Queue Page** (`/queue/[id]`) — View live queue, join with date selection, track position
5. **Ticket Confirmation** (`/ticket/[id]`) — View ticket details with QR-like code
6. **History** (`/history`) — Past tickets with status, wait times, re-join option
7. **Profile** (`/profile`) — Edit name/phone/city/address, upload avatar, notification preferences
8. **Settings** (`/settings`) — Theme toggle, language toggle, notification settings
9. **Admin Dashboard** (`/admin`) — Real-time queue control, call next, skip, no-show
10. **Admin Queue Management** (`/admin/queue`) — Create/close queues, monitor live
11. **Admin Analytics** (`/admin/analytics`) — Peak hours chart, weekly trends, health score

### Language & Theme

Click the toggle (top-right) to switch between:
- **English / العربية** — Full RTL support for Arabic
- **Light / Dark** — Persisted to localStorage

---

## Architecture Notes

- **Real-time**: Socket.IO broadcasts `queue:update` events; frontend joins per-queue rooms
- **Background Jobs**: `node-cron` checks for upcoming appointments and sends notifications
- **Notification Tracking**: `notified_events` table prevents duplicate alerts
- **Authentication**: JWT-based with protected routes; Supabase for user management
- **Error Handling**: Custom 404 page, error boundary with retry, API error sanitization (no raw DB leaks)
