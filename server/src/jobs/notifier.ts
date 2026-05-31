import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';

export function startNotifier() {
  console.log('⏰ Starting Queue Notification Scheduler...');

  cron.schedule('* * * * *', async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: queues, error: qError } = await supabaseAdmin
        .from('queues')
        .select('id, name, avg_service_time_min');

      if (qError || !queues) return;

      for (const queue of queues) {
        const { data: tickets, error: tError } = await supabaseAdmin
          .from('tickets')
          .select('*, users!inner(name)')
          .eq('queue_id', queue.id)
          .eq('target_date', today)
          .eq('status', 'waiting')
          .order('ticket_number', { ascending: true });

        if (tError || !tickets) continue;

        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i] as Record<string, unknown>;
          const estWaitMin = i * queue.avg_service_time_min;

          let notifySettings: number[] = [];
          try {
            const raw = ticket.notify_settings;
            notifySettings = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : [];
          } catch {
            notifySettings = [];
          }

          let notifiedEvents: (number | string)[] = [];
          try {
            const raw = ticket.notified_events;
            notifiedEvents = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw as string) : [];
          } catch {
            notifiedEvents = [];
          }

          let updated = false;

          if (!notifiedEvents.includes('day_of')) {
            await supabaseAdmin.from('notifications').insert({
              user_id: ticket.user_id,
              title: 'Your turn is Today!',
              message: `Just a reminder that you have a ticket booked for ${queue.name} today.`,
            });
            notifiedEvents.push('day_of');
            updated = true;
          }

          for (const mins of notifySettings) {
            if (estWaitMin <= mins && !notifiedEvents.includes(mins)) {
              await supabaseAdmin.from('notifications').insert({
                user_id: ticket.user_id,
                title: 'Your turn is approaching!',
                message: `You are approximately ${estWaitMin > 0 ? estWaitMin : '< 1'} minutes away from being called at ${queue.name}.`,
              });
              notifiedEvents.push(mins);
              updated = true;
            }
          }

          if (updated) {
            await supabaseAdmin
              .from('tickets')
              .update({ notified_events: notifiedEvents })
              .eq('id', ticket.id);
          }
        }
      }
    } catch (err) {
      console.error('Notifier Error:', err);
    }
  });
}
