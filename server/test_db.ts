import { supabaseAdmin } from './src/lib/supabase';
async function run() {
  const { data, error } = await supabaseAdmin.from('tickets').select('*, queues!inner(name, businesses!inner(name, category))').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
run();
