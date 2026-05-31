import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

import { initSocket } from './sockets';
import authRouter from './routes/auth';
import businessesRouter from './routes/businesses';
import queuesRouter from './routes/queues';
import ticketsRouter from './routes/tickets';
import notificationsRouter from './routes/notifications';
import { startNotifier } from './jobs/notifier';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'QueueLess API (Supabase)',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/queues', queuesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/notifications', notificationsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

initSocket(httpServer);
startNotifier();

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 QueueLess API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`☁️  Backend: Supabase (${process.env.SUPABASE_URL || 'not configured'})\n`);
});
