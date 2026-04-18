import { Router, Request, Response } from 'express';
import { query } from '../../db/pool';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getIO } from '../sockets';

const router = Router();

// POST /api/queues — admin creates a queue under their business
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { business_id, name, avg_service_time_min = 10 } = req.body;
  if (!business_id || !name) { res.status(400).json({ error: 'business_id and name are required' }); return; }
  try {
    // Verify ownership
    const owned = await query('SELECT id FROM businesses WHERE id = $1 AND owner_id = $2', [business_id, req.user!.userId]);
    if (!owned.rows[0]) { res.status(403).json({ error: 'Not your business' }); return; }
    const result = await query(
      'INSERT INTO queues (business_id, name, avg_service_time_min) VALUES ($1,$2,$3) RETURNING *',
      [business_id, name, avg_service_time_min]
    );
    res.status(201).json({ queue: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/queues/:queueId/tickets — get live waiting list (public)
router.get('/:queueId/tickets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { queueId } = req.params;
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT t.*, u.name AS user_name
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       WHERE t.queue_id = $1 AND t.status IN ('waiting','serving') AND t.target_date = $2
       ORDER BY t.ticket_number ASC`,
      [queueId, date]
    );
    res.json({ tickets: result.rows });
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
    // Check if queue is open
    const queueRes = await query('SELECT * FROM queues WHERE id = $1', [queueId]);
    const queue = queueRes.rows[0];
    if (!queue) { res.status(404).json({ error: 'Queue not found' }); return; }
    if (!queue.is_open) { res.status(400).json({ error: 'Queue is currently closed' }); return; }

    // Prevent duplicate active tickets for the specific date
    const existing = await query(
      `SELECT id FROM tickets WHERE queue_id = $1 AND user_id = $2 AND status IN ('waiting','serving') AND target_date = $3`,
      [queueId, userId, dateStr]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'You already have an active ticket in this queue for this date' });
      return;
    }

    // Assign next ticket number for the specific date
    const lastTicket = await query(
      'SELECT MAX(ticket_number) AS max FROM tickets WHERE queue_id = $1 AND target_date = $2',
      [queueId, dateStr]
    );
    const nextNumber = (lastTicket.rows[0].max ?? 0) + 1;

    const result = await query(
      `INSERT INTO tickets (queue_id, user_id, ticket_number, status, target_date, notify_settings)
       VALUES ($1, $2, $3, 'waiting', $4, $5) RETURNING *`,
      [queueId, userId, nextNumber, dateStr, JSON.stringify(notifySettings)]
    );
    const ticket = result.rows[0];

    // Log the action
    await query(
      `INSERT INTO queue_logs (queue_id, ticket_id, action, actor_id) VALUES ($1, $2, 'join', $3)`,
      [queueId, ticket.id, userId]
    );

    // Emit real-time update
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
    const result = await query(
      `UPDATE tickets SET status = 'cancelled', completed_at = NOW()
       WHERE id = $1 AND queue_id = $2 AND user_id = $3 AND status = 'waiting'
       RETURNING *`,
      [ticketId, queueId, req.user!.userId]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Ticket not found or cannot be cancelled' }); return; }

    await query(`INSERT INTO queue_logs (queue_id, ticket_id, action, actor_id) VALUES ($1,$2,'cancel',$3)`,
      [queueId, ticketId, req.user!.userId]);

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'cancel', ticketId });
    res.json({ ticket: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queues/:queueId/next — admin calls next person
router.post('/:queueId/next', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    // Mark current serving ticket as done
    await query(
      `UPDATE tickets SET status = 'done', completed_at = NOW()
       WHERE queue_id = $1 AND status = 'serving'`,
      [queueId]
    );

    // Call next waiting ticket for TODAY ONLY. We don't call tickets across dates.
    const todayStr = new Date().toISOString().split('T')[0];
    const next = await query(
      `UPDATE tickets SET status = 'serving', called_at = NOW()
       WHERE id = (
         SELECT id FROM tickets WHERE queue_id = $1 AND status = 'waiting' AND target_date = $2
         ORDER BY ticket_number LIMIT 1
       ) RETURNING *`,
      [queueId, todayStr]
    );

    if (!next.rows[0]) {
      getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'queue_empty' });
      res.json({ message: 'Queue is empty', serving: null });
      return;
    }

    await query(`INSERT INTO queue_logs (queue_id, ticket_id, action, actor_id) VALUES ($1,$2,'call',$3)`,
      [queueId, next.rows[0].id, req.user!.userId]);

    // Send a push notification to the user whose ticket was just called
    const queueData = await query('SELECT name FROM queues WHERE id = $1', [queueId]);
    const queueName = queueData.rows[0]?.name || 'Queue';
    await query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [
        next.rows[0].user_id, 
        "It's your turn!", 
        `Please head to the front. Your ticket #${next.rows[0].ticket_number} in ${queueName} has been called.`
      ]
    );

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'call_next', serving: next.rows[0] });
    res.json({ serving: next.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/queues/:queueId/skip — admin skips the current person
router.post('/:queueId/skip', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    const result = await query(
      `UPDATE tickets SET status = 'skipped', completed_at = NOW()
       WHERE queue_id = $1 AND status = 'serving' RETURNING *`,
      [queueId]
    );
    if (result.rows[0]) {
      await query(`INSERT INTO queue_logs (queue_id, ticket_id, action, actor_id) VALUES ($1,$2,'skip',$3)`,
        [queueId, result.rows[0].id, req.user!.userId]);
    }

    getIO().to(`queue:${queueId}`).emit('queue:update', { action: 'skip' });
    res.json({ skipped: result.rows[0] ?? null });
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
    const result = await query(
      'UPDATE queues SET is_open = $1 WHERE id = $2 RETURNING *',
      [is_open, queueId]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'Queue not found' }); return; }

    await query(`INSERT INTO queue_logs (queue_id, action, actor_id) VALUES ($1,$2,$3)`,
      [queueId, is_open ? 'open' : 'close', req.user!.userId]);

    getIO().to(`queue:${queueId}`).emit('queue:status', { is_open });
    res.json({ queue: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queues/:queueId/analytics/weekly — last 7 days per-day stats
router.get('/:queueId/analytics/weekly', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;
  try {
    const result = await query(
      `SELECT
         TO_CHAR(DATE(COALESCE(joined_at, target_date)), 'Dy') AS day,
         COUNT(*) FILTER (WHERE status = 'done') AS served,
         COUNT(*) FILTER (WHERE status = 'skipped') AS noshow
       FROM tickets
       WHERE queue_id = $1
         AND COALESCE(joined_at::date, target_date) >= CURRENT_DATE - INTERVAL '6 days'
         AND COALESCE(joined_at::date, target_date) <= CURRENT_DATE
       GROUP BY DATE(COALESCE(joined_at, target_date)), day
       ORDER BY DATE(COALESCE(joined_at, target_date))`,
      [queueId]
    );
    res.json({ weekly: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/queues/:queueId/analytics — admin analytics
router.get('/:queueId/analytics', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { queueId } = req.params;

  try {
    const [served, noshow, avgWait, hourly] = await Promise.all([
      // Count served today
      query(`SELECT COUNT(*) AS count FROM tickets
             WHERE queue_id = $1 AND status = 'done'
             AND DATE(completed_at) = CURRENT_DATE`, [queueId]),
      // No-shows (skipped)
      query(`SELECT COUNT(*) AS count FROM tickets
             WHERE queue_id = $1 AND status = 'skipped'
             AND DATE(completed_at) = CURRENT_DATE`, [queueId]),
      // Average wait time in minutes
      query(`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (called_at - joined_at))/60)) AS avg_min
             FROM tickets WHERE queue_id = $1 AND called_at IS NOT NULL
             AND DATE(joined_at) = CURRENT_DATE`, [queueId]),
      // Hourly distribution
      query(`SELECT EXTRACT(HOUR FROM joined_at) AS hour, COUNT(*) AS count
             FROM tickets WHERE queue_id = $1 AND DATE(joined_at) = CURRENT_DATE
             GROUP BY hour ORDER BY hour`, [queueId]),
    ]);

    res.json({
      served_today: Number(served.rows[0].count),
      no_shows_today: Number(noshow.rows[0].count),
      avg_wait_min: Number(avgWait.rows[0].avg_min ?? 0),
      hourly_distribution: hourly.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
