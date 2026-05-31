import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

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
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        supabase_id: authData.user.id,
        name,
        email,
        role,
        phone: phone || null,
        city: city || null,
        address: address || null,
        gender: gender || null,
      })
      .select('id, name, email, role, avatar_url, phone, city, address, gender, created_at')
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    const { data: { session }, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !session) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error('Failed to create session');
    }

    res.status(201).json({ user: profile, token: session.access_token });
  } catch (err) {
    console.error('Registration error:', err);
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
    // Use Supabase Auth REST API directly to avoid creating a second client (which fails
    // on Node 20 without `ws` transport for Realtime). The admin client's service_role key
    // stays unused for sign-in, so data queries keep using the service_role key.
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!authRes.ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const authBody = await authRes.json() as { access_token: string; user: { id: string; email?: string } };
    const lookupEmail = authBody.user.email || email;

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, avatar_url, phone, city, address, gender, created_at')
      .eq('email', lookupEmail)
      .maybeSingle();

    if (!profile) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    res.json({ user: profile, token: authBody.access_token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !supabaseUser) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const lookupEmail = supabaseUser.email || '';
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, avatar_url, phone, city, address, gender, created_at')
      .eq('email', lookupEmail)
      .maybeSingle();

    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: profile });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// PATCH /api/auth/me
router.patch('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !supabaseUser) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const { name, avatar_url, phone, city, address, gender } = req.body;

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;
    if (phone !== undefined) updateFields.phone = phone;
    if (city !== undefined) updateFields.city = city;
    if (address !== undefined) updateFields.address = address;
    if (gender !== undefined) updateFields.gender = gender;

    const lookupEmail = supabaseUser.email || '';

    if (Object.keys(updateFields).length === 0) {
      const { data: current } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, avatar_url, phone, city, address, gender, created_at')
        .eq('email', lookupEmail)
        .maybeSingle();

      res.json({ user: current });
      return;
    }

    const { data: profile, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateFields)
      .eq('email', lookupEmail)
      .select('id, name, email, role, avatar_url, phone, city, address, gender, created_at')
      .single();

    if (updateError || !profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: profile });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error or invalid token' });
  }
});

export default router;
