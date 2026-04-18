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
      ('Amr Diab', 'amr@telecom.eg', $1, 'admin', 'Cairo', 'Maadi'),
      ('Naglaa Lab', 'naglaa@alfa.com', $1, 'admin', 'Giza', 'Dokki'),
      ('Cinema Manager', 'info@citystars.com', $1, 'admin', 'Cairo', 'Heliopolis'),
      ('Bank Manager', 'manager@banquecairo.com', $1, 'admin', 'Cairo', 'Garden City'),
      ('Cafe Owner', 'hello@cilantro.eg', $1, 'admin', 'Alexandria', 'Stanley'),
      ('Museum Guide', 'tickets@museum.gov.eg', $1, 'admin', 'Giza', 'Pyramids'),
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
        name_ar: 'وقت الكشري الكبير',
        description: 'The fastest Koshary in the Middle East. No waiting in the sun anymore!',
        description_ar: 'أسرع كشري في الشرق الأوسط. مفيش انتظار في الشمس تاني!',
        category: 'restaurant',
        address: 'Downtown Cairo, Egypt',
        address_ar: 'وسط البلد، القاهرة، مصر',
        image_url: '/electric.jfif'
      },
      {
        owner_id: admins.find(a => a.name.includes('Rabbit'))?.id,
        name: 'Dr. Rabbie Clinic',
        name_ar: 'عيادة دكتور ربيع',
        description: 'Curing everything with absolute chaos. Please bring your own patience.',
        description_ar: 'بنعالج كل حاجة بالفوضى المطلقة. من فضلك هات صبرك معاك.',
        category: 'clinic',
        address: 'El Mazarita, Alexandria',
        address_ar: 'المزاريطة، الإسكندرية',
        image_url: '/clinic.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Zenin'))?.id,
        name: 'The Bureau of Stamps',
        name_ar: 'مصلحة الأختام',
        description: 'Did you bring the 4 photocopies and the stamps? If not, do not even join the queue.',
        description_ar: 'جبت الـ ٤ صور والدمغة؟ لو لا، متفكرش حتى تدخل الطابور.',
        category: 'government',
        address: 'Tahrir Square, Cairo',
        address_ar: 'ميدان التحرير، القاهرة',
        image_url: '/bank.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Amr'))?.id,
        name: 'Vodafone Customer Care',
        name_ar: 'فودافون خدمة العملاء',
        description: 'Resolve your SIM issues and plan upgrades.',
        description_ar: 'حل مشاكل الشريحة وتحديث باقتك.',
        category: 'telecom',
        address: 'Maadi, Cairo',
        address_ar: 'المعادي، القاهرة',
        image_url: '/telecom.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Naglaa'))?.id,
        name: 'Alfa Labs',
        name_ar: 'معامل ألفا',
        description: 'Precise medical testing and fast results.',
        description_ar: 'تحاليل طبية دقيقة ونتائج سريعة.',
        category: 'clinic',
        address: 'Dokki, Giza',
        address_ar: 'الدقي، الجيزة',
        image_url: '/lab.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Cinema'))?.id,
        name: 'City Stars Movie Center',
        name_ar: 'سينما سيتي ستارز',
        description: 'Book your tickets for the latest blockbusters.',
        description_ar: 'احجز تذكرتك لأحدث الأفلام.',
        category: 'entertainment',
        address: 'Heliopolis, Cairo',
        address_ar: 'مصر الجديدة، القاهرة',
        image_url: '/cinema.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Bank'))?.id,
        name: 'Banque du Caire',
        name_ar: 'بنك القاهرة',
        description: 'Personal and business banking services.',
        description_ar: 'خدمات مصرفية للأفراد والشركات.',
        category: 'bank',
        address: 'Garden City, Cairo',
        address_ar: 'جاردن سيتي، القاهرة',
        image_url: '/bank2.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Cafe'))?.id,
        name: 'Cilantro Stanley',
        name_ar: 'سيلانترو ستانلي',
        description: 'The best coffee with a view of the bridge.',
        description_ar: 'أفضل قهوة مع إطلالة على الكوبري.',
        category: 'restaurant',
        address: 'Stanley, Alexandria',
        address_ar: 'ستانلي، الإسكندرية',
        image_url: '/cafe.jpg'
      },
      {
        owner_id: admins.find(a => a.name.includes('Museum'))?.id,
        name: 'Grand Egyptian Museum',
        name_ar: 'المتحف المصري الكبير',
        description: 'Discover the treasures of ancient Egypt.',
        description_ar: 'اكتشف كنوز مصر القديمة.',
        category: 'tourism',
        address: 'Pyramids, Giza',
        address_ar: 'الأهرامات، الجيزة',
        image_url: '/museum.jpg'
      }
    ];

    const insertedBusinesses = [];
    for (const b of bizData) {
      if (!b.owner_id) continue;
      const res = await pool.query(`
        INSERT INTO businesses (owner_id, name, name_ar, description, description_ar, category, address, address_ar, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name
      `, [b.owner_id, b.name, b.name_ar, b.description, b.description_ar, b.category, b.address, b.address_ar, b.image_url]);
      insertedBusinesses.push(res.rows[0]);
    }

    // 3. Create Queues
    console.log('Creating queues...');
    const queuesList = [];
    for (const b of insertedBusinesses) {
      if (b.name.includes('Koshary')) {
        const q1 = await pool.query(`INSERT INTO queues (business_id, name, name_ar, is_open, avg_service_time_min) VALUES ($1, 'Takeaway Line', 'طابور الأكل السريع', true, 2) RETURNING id`, [b.id]);
        const q2 = await pool.query(`INSERT INTO queues (business_id, name, name_ar, is_open, avg_service_time_min) VALUES ($1, 'Dine-In Tables', 'طاولات الصالة', true, 15) RETURNING id`, [b.id]);
        queuesList.push(q1.rows[0].id, q2.rows[0].id);
      } else if (b.name.includes('Rabbie') || b.name.includes('Alfa')) {
        const q = await pool.query(`INSERT INTO queues (business_id, name, name_ar, is_open, avg_service_time_min) VALUES ($1, 'General Consultation', 'كشف عام', true, 30) RETURNING id`, [b.id]);
        queuesList.push(q.rows[0].id);
      } else if (b.name.includes('Bureau') || b.name.includes('Bank') || b.name.includes('Vodafone')) {
        const q = await pool.query(`INSERT INTO queues (business_id, name, name_ar, is_open, avg_service_time_min) VALUES ($1, 'Standard Service', 'خدمة اعتيادية', true, 20) RETURNING id`, [b.id]);
        queuesList.push(q.rows[0].id);
      } else {
        const q = await pool.query(`INSERT INTO queues (business_id, name, name_ar, is_open, avg_service_time_min) VALUES ($1, 'General Entrance', 'دخول عام', true, 10) RETURNING id`, [b.id]);
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
