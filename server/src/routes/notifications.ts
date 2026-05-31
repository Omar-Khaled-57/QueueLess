import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications — fetch all notifications for the current user
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ notifications: notifications || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count — fetch the count of unread notifications
router.get('/unread-count', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user!.userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ unread_count: count ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read — mark a notification as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user!.userId)
      .select('*')
      .single();

    if (error || !notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
