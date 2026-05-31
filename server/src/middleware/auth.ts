import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthPayload {
  userId: number;
  supabaseUserId: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const lookupEmail = supabaseUser.email || '';
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', lookupEmail)
      .maybeSingle();

    if (!profile) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    req.user = {
      userId: profile.id,
      supabaseUserId: supabaseUser.id,
      role: profile.role as 'user' | 'admin',
    };

    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
