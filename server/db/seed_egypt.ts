import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'queueless'
});

async function runSeed() {
  console.log('Seeding mock Egyptian data...');
  try {
    const hash = await bcrypt.hash('password123', 10);

    // 1. Create Users
    console.log('Creating users...');
    const usersResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, city, address) VALUES 
      ('Uncle Johnny', 'abu@koshary.com', $1, 'admin', 'Cairo', 'Downtown'),
      ('John Rabbit', 'rabie@clinic.com', $1, 'admin', 'Alexandria', 'Mazarita'),
      ('Jouhn Zenin', 'afaf@mogamma.gov.eg', $1, 'admin', 'Cairo', 'Tahrir Square'),
      ('Panda Man', 'bassem@user.com', $1, 'user', 'Cairo', 'Zamalek'),
      ('John Man', 'helmy@user.com', $1, 'user', 'Giza', 'Dokki'),
      ('Johnny Appleseed', 'mona@user.com', $1, 'user', 'Giza', 'Maadi'),
      ('Sir John Doe', 'mo@user.com', $1, 'user', 'Liverpool', 'Anfield')
      RETURNING id, name, role;
    `, [hash]);

    const admins = usersResult.rows.filter(u => u.role === 'admin');
    const customers = usersResult.rows.filter(u => u.role === 'user');

    // 2. Create Businesses
    console.log('Creating businesses...');
    const bizData = [
      {
        owner_id: admins.find(a => a.name.includes('Uncle Johnny'))?.id,
        name: 'Big Koshary Time!',
        description: 'The fastest Koshary in the Middle East. No waiting in the sun anymore!',
        category: 'restaurant',
        address: 'Downtown Cairo, Egypt',
        image_url: '/electric.jfif'
      },
      {
        owner_id: admins.find(a => a.name.includes('Rabbit'))?.id,
        name: 'Dr. Rabbioid Clinic',
        description: 'Curing everything with absolute chaos. Please bring your own patience.',
        category: 'clinic',
        address: 'El Mazarita, Alexandria',
        image_url: '/clinic.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Zenin'))?.id,
        name: 'The Bureau of Stamps',
        description: 'Did you bring the 4 photocopies and the stamps? If not, do not even join the queue.',
        category: 'government',
        address: 'Tahrir Square, Cairo',
        image_url: '/bank.jpg'
      }
    ];

    const insertedBusinesses = [];
    for (const b of bizData) {
      if (!b.owner_id) continue;
      const res = await pool.query(`
        INSERT INTO businesses (owner_id, name, description, category, address)
        VALUES ($1, $2, $3, $4, $5) RETURNING id, name
      `, [b.owner_id, b.name, b.description, b.category, b.address]);
      insertedBusinesses.push(res.rows[0]);
    }

    // 3. Create Queues
    console.log('Creating queues...');
    const queuesList = [];
    for (const b of insertedBusinesses) {
      if (b.name.includes('Koshary')) {
        const q1 = await pool.query(`INSERT INTO queues (business_id, name, is_open, avg_service_time_min) VALUES ($1, 'Takeaway Line', true, 2) RETURNING id`, [b.id]);
        const q2 = await pool.query(`INSERT INTO queues (business_id, name, is_open, avg_service_time_min) VALUES ($1, 'Dine-In Tables', true, 15) RETURNING id`, [b.id]);
        queuesList.push(q1.rows[0].id, q2.rows[0].id);
      } else if (b.name.includes('Rabbioid')) {
        const q = await pool.query(`INSERT INTO queues (business_id, name, is_open, avg_service_time_min) VALUES ($1, 'General Consultation', true, 30) RETURNING id`, [b.id]);
        queuesList.push(q.rows[0].id);
      } else if (b.name.includes('Bureau')) {
        const q = await pool.query(`INSERT INTO queues (business_id, name, is_open, avg_service_time_min) VALUES ($1, 'Stamp Approvals', true, 45) RETURNING id`, [b.id]);
        queuesList.push(q.rows[0].id);
      }
    }

    // 4. Create Tickets & History
    console.log('Creating ticket histories...');
    const today = new Date().toISOString().split('T')[0];
    
    // Create some historical tickets (status = done/skipped) yesterday
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    for (let i = 0; i < 15; i++) {
        const qId = queuesList[Math.floor(Math.random() * queuesList.length)];
        const custId = customers[Math.floor(Math.random() * customers.length)].id;
        const targetDate = Math.random() > 0.3 ? today : yesterday;
        const status = targetDate === yesterday ? (Math.random() > 0.8 ? 'skipped' : 'done') : (Math.random() > 0.8 ? 'serving' : 'waiting');

        try {
            await pool.query(`
               INSERT INTO tickets (queue_id, user_id, ticket_number, status, target_date, joined_at, completed_at)
               VALUES ($1, $2, $3, $4, $5, NOW() - interval '2 hours', $6)
            `, [
               qId, 
               custId, 
               i + 1, 
               status, 
               targetDate, 
               status === 'done' || status === 'skipped' ? "NOW() - interval '1 hour'" : null
            ]);
        } catch (e) {
            // Ignore unique constraints if any
        }
    }

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    pool.end();
  }
}

runSeed();
