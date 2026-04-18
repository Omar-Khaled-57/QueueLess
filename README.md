# QueueLess 🚀

> **My First Ever Complete Full-Stack Project.**
> 
> QueueLess is a dynamic, fully-featured digital queuing and appointment scheduling platform. Built with a modern full-stack architecture, it empowers businesses to completely eliminate physical line-ups through a real-time ticketing engine, notification schedulers, and a responsive UI.

---

## 🌟 Overview & Simulation Disclaimer

QueueLess is designed as a **dynamic simulation** of real-world service environments. 
- **The Simulation**: The queuing logic, real-time wait-time calculations, and notification triggers are accurately modeled and function as they would in a production environment.
- **The Data**: Please note that all businesses (e.g., "Big Koshary Time!") and personas (e.g., "Uncle Johnny") are **entirely fictional** and used for demonstration purposes.

---

## 🛠 Technology Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.IO (Real-time), node-cron (Background jobs)
- **Database**: PostgreSQL
- **State Management**: React Context API & Custom Hooks

---

## 🚀 Key Features

- **Real-time Queue Updates**: Powered by WebSockets to broadcast ticket progress and service alerts live.
- **Intelligent Wait-Time Engine**: Background jobs calculate estimated wait times based on live service averages.
- **Future Date Scheduling**: Book appointments for upcoming dates based on business operating schedules.
- **Multi-lingual & Themed**: Full support for English/Arabic (RTL) and Light/Dark modes.
- **Admin Command Center**: Real-time analytics, queue control (calling next, skipping), and business management.

---

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)

### 2. Database Installation
1. Create a new database in PostgreSQL named `queueless`.
2. Run the schema file to set up tables:
   ```bash
   psql -U postgres -d queueless -f server/db/schema.sql
   ```

### 3. Environment Configuration
Create a `.env` file in the `server` directory based on the `.env.example`:
```bash
cp server/.env.example server/.env
```
Update the `DATABASE_URL` in `.env` to match your local PostgreSQL credentials.

### 4. Seeding Mock Data
Pre-fill the simulation with mock users, businesses, and historical records:
```bash
cd server
npm install
npx ts-node db/seed_egypt.ts
```

### 5. Running the Application
Open two terminals:

**Terminal 1 (Backend)**:
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
cd client
npm install
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 👥 Mock Accounts

All mock accounts listed below share the same default password: `password123`.

### Business Administrators (Access to `/admin`)
These accounts own simulated businesses and can actively control queue pacing:

| Name | Email | Business |
| :--- | :--- | :--- |
| **Uncle Johnny** | `abu@koshary.com` | Big Koshary Time! |
| **John Rabbit** | `rabie@clinic.com` | Dr. Rabbioid Clinic |
| **Jouhn Zenin** | `afaf@mogamma.gov.eg` | The Bureau of Stamps |

### Regular Customers (Access to `/dashboard`)
These accounts can browse queues, schedule tickets, and view history:

- `bassem@user.com`
- `helmy@user.com`
- `mona@user.com`
- `mo@user.com`

---

## 🏗 Architecture Details

QueueLess utilizes a specialized `notified_events` tracking system within tickets to prevent redundant alerts. It employs a **Background Notification Engine** that checks for upcoming appointments and delivers alerts via cron jobs. The frontend remains "hydrated" and synchronized with the backend state via a custom WebSocket implementation.
