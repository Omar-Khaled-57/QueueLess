import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/businesses — list all active businesses (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: businesses, error } = await supabaseAdmin
      .from('businesses')
      .select('*, users!inner(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (businesses || []).map((b: Record<string, unknown>) => ({
      ...b,
      owner_name: (b.users as Record<string, unknown>)?.name || null,
      users: undefined,
    }));

    res.json({ businesses: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/businesses/:id — single business with its queues (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (bizError || !business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    const { data: queues, error: qError } = await supabaseAdmin
      .from('queues')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: true });

    if (qError) throw qError;

    res.json({ business, queues: queues || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/businesses — create a business (admin only)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, category, address, image_url } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Business name is required' });
    return;
  }

  try {
    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .insert({
        owner_id: req.user!.userId,
        name,
        description: description || null,
        category: category || 'general',
        address: address || null,
        image_url: image_url || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ business });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/businesses/:id — update (admin, owner only)
router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, category, address, image_url, is_active } = req.body;

  try {
    const { data: owned } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('id', id)
      .eq('owner_id', req.user!.userId)
      .single();

    if (!owned) {
      res.status(403).json({ error: 'Not your business' });
      return;
    }

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (address !== undefined) updateFields.address = address;
    if (image_url !== undefined) updateFields.image_url = image_url;
    if (is_active !== undefined) updateFields.is_active = is_active;

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({ business });
  } catch (err) {
    console.error('Business PATCH error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
