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

// TEMP DEBUG — remove after debugging Railway empty response
import { supabaseAdmin } from './lib/supabase';
app.get('/debug/db', async (_req, res) => {
  const results: Record<string, unknown> = {};
  try {
    const { data: biz, error: be } = await supabaseAdmin.from('businesses').select('id, name');
    results.businesses = { count: biz?.length ?? 0, error: be?.message ?? null };
  } catch (e: unknown) { results.businesses = { error: String(e) }; }
  try {
    const { data: usr, error: ue } = await supabaseAdmin.from('users').select('id, name').limit(3);
    results.users = { count: usr?.length ?? 0, error: ue?.message ?? null, sample: usr?.map((u: Record<string, unknown>) => u.name) };
  } catch (e: unknown) { results.users = { error: String(e) }; }
  try {
    const { data: all } = await supabaseAdmin.from('businesses').select('*, users!inner(name)').eq('is_active', true);
    results.businesses_join = { count: all?.length ?? 0 };
  } catch (e: unknown) { results.businesses_join = { error: String(e) }; }
  results.env = { SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing', SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `set (len=${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : 'missing', NODE_ENV: process.env.NODE_ENV || 'not set' };
  res.json(results);
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
