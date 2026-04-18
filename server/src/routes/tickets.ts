import { Router, Request, Response } from 'express';
import { query } from '../../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/tickets/my — get the current user's ticket history
router.get('/my', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT t.*, q.name AS queue_name, b.name AS business_name, b.category
       FROM tickets t
       JOIN queues q ON q.id = t.queue_id
       JOIN businesses b ON b.id = q.business_id
       WHERE t.user_id = $1
       ORDER BY t.joined_at DESC`,
      [req.user!.userId]
    );
    res.json({ tickets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets/my/active — get current user's active ticket (if any)
router.get('/my/active', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT t.*, q.name AS queue_name, b.name AS business_name,
              b.category, b.address,
              (SELECT COUNT(*) FROM tickets t2
               WHERE t2.queue_id = t.queue_id
               AND t2.status = 'waiting'
               AND t2.ticket_number < t.ticket_number) AS position_ahead
       FROM tickets t
       JOIN queues q ON q.id = t.queue_id
       JOIN businesses b ON b.id = q.business_id
       WHERE t.user_id = $1 AND t.status IN ('waiting','serving')
       ORDER BY t.joined_at DESC
       LIMIT 1`,
      [req.user!.userId]
    );
    res.json({ ticket: result.rows[0] ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
