import cron from 'node-cron';
import { query } from '../../db/pool';

export function startNotifier() {
  console.log('⏰ Starting Queue Notification Scheduler...');
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all active queues
      // We don't necessarily only check open queues, because a queue might open later today, but ticket is booked.
      const queuesResult = await query('SELECT id, name, avg_service_time_min FROM queues');
      
      for (const queue of queuesResult.rows) {
        // Fetch waiting tickets for today in order
        const ticketsResult = await query(
          `SELECT t.*, u.name AS user_name 
           FROM tickets t
           JOIN users u ON u.id = t.user_id
           WHERE t.queue_id = $1 AND t.target_date = $2 AND t.status = 'waiting'
           ORDER BY t.ticket_number ASC`,
          [queue.id, today]
        );

        const tickets = ticketsResult.rows;
        
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          const estWaitMin = i * queue.avg_service_time_min;
          
          let notifySettings: number[] = [];
          try { 
            notifySettings = typeof ticket.notify_settings === 'string' ? JSON.parse(ticket.notify_settings) : ticket.notify_settings || []; 
          } catch(e){}
          
          let notifiedEvents: (number | string)[] = [];
          try { 
            notifiedEvents = typeof ticket.notified_events === 'string' ? JSON.parse(ticket.notified_events) : ticket.notified_events || []; 
          } catch(e){}

          let updated = false;

          // 1. "Day has come" notification
          if (!notifiedEvents.includes('day_of')) {
            await query(
               `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
               [ticket.user_id, "Your turn is Today!", `Just a reminder that you have a ticket booked for ${queue.name} today.`]
            );
            notifiedEvents.push('day_of');
            updated = true;
          }

          // 2. Custom minute notification (e.g., 30 mins)
          for (const mins of notifySettings) {
             if (estWaitMin <= mins && !notifiedEvents.includes(mins)) {
                await query(
                   `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
                   [ticket.user_id, "Your turn is approaching!", `You are approximately ${estWaitMin > 0 ? estWaitMin : '< 1'} minutes away from being called at ${queue.name}.`]
                );
                notifiedEvents.push(mins);
                updated = true;
             }
          }

          if (updated) {
            await query('UPDATE tickets SET notified_events = $1 WHERE id = $2', [JSON.stringify(notifiedEvents), ticket.id]);
          }
        }
      }
    } catch (err) {
      console.error('Notifier Error:', err);
    }
  });
}
