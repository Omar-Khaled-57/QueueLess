import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getIO } from '../sockets';

const router = Router();

// POST /api/queues — admin creates a queue under their business
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { business_id, name, avg_service_time_min = 10 } = req.body;
  if (!business_id || !name) {
    res.status(400).json({ error: 'business_id and name are required' });
    return;
  }

  try {
    const { data: owned } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('owner_id', req.user!.userId)
      .single();

    if (!owned) {
      res.status(403).json({ error: 'Not your business' });
      return;
    }

    const { data: queue, error } = await supabaseAdmin
      .from('queues')
      .insert({ business_id, name, avg_service_time_min })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ queue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queues/:queueId/tickets — get live waiting list (public)
router.get('/:queueId/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { queueId } = req.params;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*, users!inner(name)')
      .eq('queue_id', queueId)
      .in('status', ['waiting', 'serving'])
      .eq('target_date', date)
      .order('ticket_number', { ascending: true });

    if (error) throw error;

    const mapped = (tickets || []).map((t: Record<string, unknown>) => ({
      ...t,
      user_name: (t.users as Record<string, unknown>)?.name || null,
      users: undefined,
    }));

    res.json({ tickets: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queues/:queueId/join — customer joins a queue
router.post('/:queueId/join', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;
  const userId = req.user!.userId;
  const { targetDate, notifySettings = [] } = req.body;
  const dateStr = targetDate || new Date().toISOString().split('T')[0];

  try {
    const { data: queue, error: queueError } = await supabaseAdmin
      .from('queues')
      .select('*')
      .eq('id', queueId)
      .single();

    if (queueError || !queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    if (!queue.is_open) {
      res.status(400).json({ error: 'Queue is currently closed' });
      return;
    }

    const { data: existing } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('queue_id', queueId)
      .eq('user_id', userId)
      .in('status', ['waiting', 'serving'])
      .eq('target_date', dateStr)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: 'You already have an active ticket in this queue for this date' });
      return;
    }

    const { data: lastTicket } = await supabaseAdmin
      .from('tickets')
      .select('ticket_number')
      .eq('queue_id', queueId)
      .eq('target_date', dateStr)
      .order('ticket_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = (lastTicket?.ticket_number ?? 0) + 1;

    const { data: ticket, error: insertError } = await supabaseAdmin
      .from('tickets')
      .insert({
        queue_id: Number(queueId),
        user_id: userId,
        ticket_number: nextNumber,
        status: 'waiting',
        target_date: dateStr,
        notify_settings: notifySettings,
        notified_events: [],
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    await supabaseAdmin
      .from('queue_logs')
      .insert({
        queue_id: Number(queueId),
        ticket_id: ticket.id,
        action: 'join',
        actor_id: userId,
      });

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'join', ticket });

    res.status(201).json({ ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/queues/:queueId/tickets/:ticketId/cancel — customer cancels their ticket
router.patch('/:queueId/tickets/:ticketId/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { queueId, ticketId } = req.params;

  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('queue_id', queueId)
      .eq('user_id', req.user!.userId)
      .eq('status', 'waiting')
      .select('*')
      .single();

    if (error || !ticket) {
      res.status(404).json({ error: 'Ticket not found or cannot be cancelled' });
      return;
    }

    await supabaseAdmin
      .from('queue_logs')
      .insert({
        queue_id: Number(queueId),
        ticket_id: Number(ticketId),
        action: 'cancel',
        actor_id: req.user!.userId,
      });

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'cancel', ticketId });
    res.json({ ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queues/:queueId/next — admin calls next person
router.post('/:queueId/next', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    await supabaseAdmin
      .from('tickets')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('queue_id', queueId)
      .eq('status', 'serving');

    const todayStr = new Date().toISOString().split('T')[0];

    const { data: nextTicket } = await supabaseAdmin.rpc('call_next_ticket', {
      p_queue_id: Number(queueId),
      p_target_date: todayStr,
    });

    if (!nextTicket || (Array.isArray(nextTicket) && nextTicket.length === 0)) {
      getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'queue_empty' });
      res.json({ message: 'Queue is empty', serving: null });
      return;
    }

    const ticket = Array.isArray(nextTicket) ? nextTicket[0] : nextTicket;

    await supabaseAdmin
      .from('queue_logs')
      .insert({
        queue_id: Number(queueId),
        ticket_id: ticket.id,
        action: 'call',
        actor_id: req.user!.userId,
      });

    const { data: queueData } = await supabaseAdmin
      .from('queues')
      .select('name')
      .eq('id', queueId)
      .single();

    const queueName = queueData?.name || 'Queue';

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: ticket.user_id,
        title: "It's your turn!",
        message: `Please head to the front. Your ticket #${ticket.ticket_number} in ${queueName} has been called.`,
      });

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'call_next', serving: ticket });
    res.json({ serving: ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queues/:queueId/skip — admin skips the current person
router.post('/:queueId/skip', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    const { data: skipped, error } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'skipped', completed_at: new Date().toISOString() })
      .eq('queue_id', queueId)
      .eq('status', 'serving')
      .select('*')
      .single();

    if (skipped) {
      await supabaseAdmin
        .from('queue_logs')
        .insert({
          queue_id: Number(queueId),
          ticket_id: skipped.id,
          action: 'skip',
          actor_id: req.user!.userId,
        });
    }

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'skip' });
    res.json({ skipped: skipped ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/queues/:queueId/open — admin opens/closes queue
router.patch('/:queueId/open', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;
  const { is_open } = req.body;

  try {
    const { data: queue, error } = await supabaseAdmin
      .from('queues')
      .update({ is_open })
      .eq('id', queueId)
      .select('*')
      .single();

    if (error || !queue) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    await supabaseAdmin
      .from('queue_logs')
      .insert({
        queue_id: Number(queueId),
        action: is_open ? 'open' : 'close',
        actor_id: req.user!.userId,
      });

    getIO().to(`queue:${queueId}`).emit('queue:status', { is_open });
    res.json({ queue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queues/:queueId/analytics/weekly — last 7 days per-day stats
router.get('/:queueId/analytics/weekly', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    const { data: weekly, error } = await supabaseAdmin
      .rpc('get_weekly_analytics', { p_queue_id: Number(queueId) });

    if (error) throw error;

    res.json({ weekly: weekly || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queues/:queueId/analytics — admin analytics
router.get('/:queueId/analytics', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    const { data: servedData } = await supabaseAdmin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .eq('status', 'done')
      .gte('completed_at', new Date().toISOString().split('T')[0]);

    const { data: noshowData } = await supabaseAdmin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .eq('status', 'skipped')
      .gte('completed_at', new Date().toISOString().split('T')[0]);

    const { data: avgWaitData } = await supabaseAdmin
      .rpc('get_avg_wait_min', { p_queue_id: Number(queueId) });

    const { data: hourlyData } = await supabaseAdmin
      .rpc('get_hourly_distribution', { p_queue_id: Number(queueId) });

    res.json({
      served_today: servedData?.length ?? 0,
      no_shows_today: noshowData?.length ?? 0,
      avg_wait_min: Number(avgWaitData?.[0]?.avg_min ?? 0),
      hourly_distribution: hourlyData || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
