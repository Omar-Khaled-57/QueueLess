import { Router, Request, Response } from 'express';
import { query } from '../../db/pool';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications
// Fetch all notifications for the current user
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user!.userId]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count
// Fetch the count of unread notifications
router.get('/unread-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user!.userId]
    );
    res.json({ unread_count: Number(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read
// Mark a notification as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ notification: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
