import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/tickets/my — get the current user's ticket history
router.get('/my', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        queues!inner (
          name,
          businesses!inner (name, category)
        )
      `)
      .eq('user_id', req.user!.userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    const mapped = (tickets || []).map((t: Record<string, unknown>) => {
      const q = t.queues as Record<string, unknown> | undefined;
      const b = q?.businesses as Record<string, unknown> | undefined;
      return {
        ...t,
        queue_name: q?.name || null,
        business_name: b?.name || null,
        category: b?.category || null,
        queues: undefined,
      };
    });

    res.json({ tickets: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets/my/active — get current user's active ticket (if any)
router.get('/my/active', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        queues!inner (
          name,
          businesses!inner (name, category, address)
        )
      `)
      .eq('user_id', req.user!.userId)
      .in('status', ['waiting', 'serving'])
      .order('joined_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!tickets || tickets.length === 0) {
      res.json({ ticket: null });
      return;
    }

    const t = tickets[0] as Record<string, unknown>;
    const q = t.queues as Record<string, unknown> | undefined;
    const b = q?.businesses as Record<string, unknown> | undefined;
    const queueId = t.queue_id as number;
    const ticketNumber = t.ticket_number as number;

    const { count: positionAhead } = await supabaseAdmin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('queue_id', queueId)
      .eq('status', 'waiting')
      .lt('ticket_number', ticketNumber);

    const mapped = {
      ...t,
      queue_name: q?.name || null,
      business_name: b?.name || null,
      category: b?.category || null,
      address: b?.address || null,
      position_ahead: positionAhead ?? 0,
      queues: undefined,
    };

    res.json({ ticket: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
