import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../db/pool';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role = 'user', phone, city, address, gender } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  if (!['user', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Role must be "user" or "admin"' });
    return;
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role, phone, city, address, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role, avatar_url, phone, city, address, gender, created_at',
      [name, email, password_hash, role, phone, city, address, gender]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN as string }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN as string }
    );

    const { password_hash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const result = await query(
      'SELECT id, name, email, role, avatar_url, phone, city, address, gender, created_at FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: result.rows[0] });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// PATCH /api/auth/me
router.patch('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const { name, avatar_url, phone, city, address, gender } = req.body;
    
    const result = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         avatar_url = COALESCE($2, avatar_url),
         phone = COALESCE($3, phone),
         city = COALESCE($4, city),
         address = COALESCE($5, address),
         gender = COALESCE($6, gender)
       WHERE id = $7 RETURNING id, name, email, role, avatar_url, phone, city, address, gender, created_at`,
      [name, avatar_url, phone, city, address, gender, payload.userId]
    );
    
    if (!result.rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error or invalid token' });
  }
});

export default router;
