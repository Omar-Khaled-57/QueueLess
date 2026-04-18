import { Router, Request, Response } from 'express';
import { query } from '../../db/pool';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/businesses — list all active businesses (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT b.*, u.name AS owner_name
       FROM businesses b
       JOIN users u ON u.id = b.owner_id
       WHERE b.is_active = true
       ORDER BY b.created_at DESC`
    );
    res.json({ businesses: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/businesses/:id — single business with its queues (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const bizRes = await query('SELECT * FROM businesses WHERE id = $1', [id]);
    if (!bizRes.rows[0]) { res.status(404).json({ error: 'Business not found' }); return; }

    const queuesRes = await query(
      'SELECT * FROM queues WHERE business_id = $1 ORDER BY created_at',
      [id]
    );
    res.json({ business: bizRes.rows[0], queues: queuesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/businesses — create a business (admin only)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, category, address, image_url } = req.body;
  if (!name) { res.status(400).json({ error: 'Business name is required' }); return; }

  try {
    const result = await query(
      'INSERT INTO businesses (owner_id, name, description, category, address, image_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user!.userId, name, description, category || 'general', address, image_url]
    );
    res.status(201).json({ business: result.rows[0] });
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
    const owned = await query(
      'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
      [id, req.user!.userId]
    );
    if (!owned.rows[0]) { res.status(403).json({ error: 'Not your business' }); return; }

    const result = await query(
      `UPDATE businesses SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        address = COALESCE($4, address),
        image_url = COALESCE($5, image_url),
        is_active = COALESCE($6, is_active)
       WHERE id = $7 RETURNING *`,
      [name, description, category, address, image_url, is_active, id]
    );
    res.json({ business: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
