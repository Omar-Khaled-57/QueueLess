import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. ' +
    'Set these in the .env file of the server directory.'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wsTransport: any = undefined;
try {
  wsTransport = require('ws');
} catch {
  // Node >= 22 has native WebSocket, no extra dep needed
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: wsTransport ? { transport: wsTransport } : undefined,
});
