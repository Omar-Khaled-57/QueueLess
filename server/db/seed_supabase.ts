import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('🌱 Seeding QueueLess with comprehensive mock data...\n');

  // ── Step 0: Install helper SQL functions ────────────────
  console.log('📦 Installing helper SQL functions...');
  await installSqlFunctions();

  // ── Step 1: Create users via Supabase Auth + profiles ───
  console.log('👤 Creating users...');
  const users = await createUsers();

  // ── Step 2: Create businesses ───────────────────────────
  console.log('🏪 Creating businesses...');
  const businesses = await createBusinesses(users);

  // ── Step 3: Create queues ───────────────────────────────
  console.log('🔢 Creating queues...');
  const queues = await createQueues(businesses);

  // ── Step 4: Create ticket history ───────────────────────
  console.log('🎫 Creating ticket history...');
  await createTicketHistory(queues, users);

  // ── Step 5: Create notifications ────────────────────────
  console.log('🔔 Creating notifications...');
  await createNotifications(users);

  console.log('\n✅ Seeding complete!');
  console.log('🚀 Your Supabase project is ready for QueueLess.');
}

async function installSqlFunctions() {
  const functions = [
    {
      name: 'call_next_ticket',
      sql: `
        CREATE OR REPLACE FUNCTION call_next_ticket(p_queue_id INT, p_target_date DATE)
        RETURNS SETOF tickets AS $$
        DECLARE
          next_ticket tickets%ROWTYPE;
        BEGIN
          UPDATE tickets SET status = 'serving', called_at = NOW()
          WHERE id = (
            SELECT id FROM tickets
            WHERE queue_id = p_queue_id AND status = 'waiting' AND target_date = p_target_date
            ORDER BY ticket_number LIMIT 1
          )
          RETURNING * INTO next_ticket;
          RETURN NEXT next_ticket;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    },
    {
      name: 'get_weekly_analytics',
      sql: `
        CREATE OR REPLACE FUNCTION get_weekly_analytics(p_queue_id INT)
        RETURNS TABLE(day TEXT, served BIGINT, noshow BIGINT) AS $$
        BEGIN
          RETURN QUERY
          SELECT
            TO_CHAR(d::DATE, 'Dy') AS day,
            COUNT(*) FILTER (WHERE t.status = 'done')::BIGINT AS served,
            COUNT(*) FILTER (WHERE t.status = 'skipped')::BIGINT AS noshow
          FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day') AS d
          LEFT JOIN tickets t ON t.queue_id = p_queue_id
            AND COALESCE(t.completed_at::date, t.target_date) = d::date
          GROUP BY d
          ORDER BY d;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    },
    {
      name: 'get_avg_wait_min',
      sql: `
        CREATE OR REPLACE FUNCTION get_avg_wait_min(p_queue_id INT)
        RETURNS TABLE(avg_min NUMERIC) AS $$
        BEGIN
          RETURN QUERY
          SELECT ROUND(AVG(EXTRACT(EPOCH FROM (called_at - joined_at))/60))::NUMERIC AS avg_min
          FROM tickets
          WHERE queue_id = p_queue_id AND called_at IS NOT NULL
            AND DATE(joined_at) = CURRENT_DATE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    },
    {
      name: 'get_hourly_distribution',
      sql: `
        CREATE OR REPLACE FUNCTION get_hourly_distribution(p_queue_id INT)
        RETURNS TABLE(hour DOUBLE PRECISION, count BIGINT) AS $$
        BEGIN
          RETURN QUERY
          SELECT EXTRACT(HOUR FROM joined_at) AS hour, COUNT(*)::BIGINT AS count
          FROM tickets
          WHERE queue_id = p_queue_id AND DATE(joined_at) = CURRENT_DATE
          GROUP BY hour
          ORDER BY hour;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `,
    },
  ];

  for (const fn of functions) {
    const { error } = await supabase.rpc('exec_sql', {
      query_text: fn.sql,
      query_params: '[]',
    });
    if (error) {
      console.warn(`  ⚠️  Could not install ${fn.name}: ${error.message}`);
      console.log('  ℹ️  You may need to run the SQL manually in Supabase SQL Editor.');
      console.log(`     See server/db/migrations/000_${fn.name}.sql`);
    } else {
      console.log(`  ✅ Installed ${fn.name}`);
    }
  }
}

async function createUsers() {
  const userData = [
    { name: 'Uncle Johnny', email: 'abu@koshary.com', password: 'password123', role: 'admin', phone: '01000000001', city: 'Cairo', address: 'Downtown Cairo', gender: 'male' },
    { name: 'John Rabbit', email: 'rabie@clinic.com', password: 'password123', role: 'admin', phone: '01000000002', city: 'Alexandria', address: 'El Mazarita', gender: 'male' },
    { name: 'Jouhn Zenin', email: 'afaf@mogamma.gov.eg', password: 'password123', role: 'admin', phone: '01000000003', city: 'Cairo', address: 'Tahrir Square', gender: 'male' },
    { name: 'Amr Diab', email: 'amr@telecom.eg', password: 'password123', role: 'admin', phone: '01000000004', city: 'Cairo', address: 'Maadi', gender: 'male' },
    { name: 'Naglaa Lab', email: 'naglaa@alfa.com', password: 'password123', role: 'admin', phone: '01000000005', city: 'Giza', address: 'Dokki', gender: 'female' },
    { name: 'Cinema Manager', email: 'info@citystars.com', password: 'password123', role: 'admin', phone: '01000000006', city: 'Cairo', address: 'Heliopolis', gender: 'male' },
    { name: 'Bank Manager', email: 'manager@banquecairo.com', password: 'password123', role: 'admin', phone: '01000000007', city: 'Cairo', address: 'Garden City', gender: 'male' },
    { name: 'Cafe Owner', email: 'hello@cilantro.eg', password: 'password123', role: 'admin', phone: '01000000008', city: 'Alexandria', address: 'Stanley', gender: 'male' },
    { name: 'Museum Guide', email: 'tickets@museum.gov.eg', password: 'password123', role: 'admin', phone: '01000000009', city: 'Giza', address: 'Pyramids', gender: 'male' },
    { name: 'Panda Man', email: 'bassem@user.com', password: 'password123', role: 'user', phone: '01000000010', city: 'Cairo', address: 'Zamalek', gender: 'male' },
    { name: 'John Man', email: 'helmy@user.com', password: 'password123', role: 'user', phone: '01000000011', city: 'Giza', address: 'Dokki', gender: 'male' },
    { name: 'Johnny Appleseed', email: 'mona@user.com', password: 'password123', role: 'user', phone: '01000000012', city: 'Giza', address: 'Maadi', gender: 'female' },
    { name: 'Sir John Doe', email: 'mo@user.com', password: 'password123', role: 'user', phone: '01000000013', city: 'Liverpool', address: 'Anfield', gender: 'male' },
    { name: 'Fatima El-Sayed', email: 'fatima@user.com', password: 'password123', role: 'user', phone: '01000000014', city: 'Cairo', address: 'Nasr City', gender: 'female' },
    { name: 'Karim Hassan', email: 'karim@user.com', password: 'password123', role: 'user', phone: '01000000015', city: 'Alexandria', address: 'Smouha', gender: 'male' },
    { name: 'Nourhan Ali', email: 'nourhan@user.com', password: 'password123', role: 'user', phone: '01000000016', city: 'Giza', address: 'Mohandessin', gender: 'female' },
    { name: 'Youssef Ibrahim', email: 'youssef@user.com', password: 'password123', role: 'user', phone: '01000000017', city: 'Cairo', address: 'Heliopolis', gender: 'male' },
    { name: 'Mariam George', email: 'mariam@user.com', password: 'password123', role: 'user', phone: '01000000018', city: 'Cairo', address: 'Shubra', gender: 'female' },
    { name: 'Ahmed Mahmoud', email: 'ahmed@user.com', password: 'password123', role: 'user', phone: '01000000019', city: 'Giza', address: '6th October', gender: 'male' },
    { name: 'Laila Sherif', email: 'laila@user.com', password: 'password123', role: 'user', phone: '01000000020', city: 'Alexandria', address: 'Montaza', gender: 'female' },
  ];

  const createdUsers: Array<{ id: number; name: string; email: string; role: string }> = [];

  for (const u of userData) {
    const { error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: existing } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('email', u.email)
          .single();

        if (existing) {
          createdUsers.push(existing);
          console.log(`  ℹ️  ${u.email} already exists (id=${existing.id})`);
        }
        continue;
      }
      console.error(`  ❌ Failed to create ${u.email}: ${authError.message}`);
      continue;
    }

    const { data: authUser } = await supabase.auth.admin.listUsers();
    const matched = authUser?.users.find(au => au.email === u.email);
    if (!matched) {
      console.error(`  ❌ Could not find newly created user: ${u.email}`);
      continue;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        supabase_id: matched.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        city: u.city,
        address: u.address,
        gender: u.gender,
      })
      .select('id, name, email, role')
      .single();

    if (profileError) {
      console.error(`  ❌ Profile insert failed for ${u.email}: ${profileError.message}`);
      continue;
    }

    createdUsers.push(profile);
    console.log(`  ✅ Created ${u.role}: ${u.name} (${u.email})`);
  }

  return createdUsers;
}

async function createBusinesses(users: Array<{ id: number; name: string; role: string }>) {
  const admins = users.filter(u => u.role === 'admin');
  const getAdminId = (namePart: string) => admins.find(a => a.name.toLowerCase().includes(namePart.toLowerCase()))?.id;

  const bizData = [
    { owner_id: getAdminId('Johnny'), name: 'Big Koshary Time!', name_ar: 'وقت الكشري الكبير', description: 'The fastest Koshary in the Middle East. Fresh lentils, rice, and pasta served daily.', description_ar: 'أسرع كشري في الشرق الأوسط. عدس وأرز ومكرونة طازجة يومياً.', category: 'restaurant', address: 'Downtown Cairo, Egypt', address_ar: 'وسط البلد، القاهرة، مصر', image_url: '/electric.jfif', operating_days: [0, 1, 2, 3, 4, 5, 6] },
    { owner_id: getAdminId('Rabbit'), name: 'Dr. Rabbie Clinic', name_ar: 'عيادة دكتور ربيع', description: 'General practice clinic serving the Alexandria community with care.', description_ar: 'عيادة عامة تخدم مجتمع الإسكندرية بعناية.', category: 'clinic', address: 'El Mazarita, Alexandria', address_ar: 'المزاريطة، الإسكندرية', image_url: '/clinic.jpg', operating_days: [0, 1, 2, 3, 4] },
    { owner_id: getAdminId('Zenin'), name: 'The Bureau of Stamps', name_ar: 'مصلحة الأختام', description: 'Official government document stamping and certification services.', description_ar: 'خدمات ختم وتصديق المستندات الحكومية الرسمية.', category: 'government', address: 'Tahrir Square, Cairo', address_ar: 'ميدان التحرير، القاهرة', image_url: '/bank.jpg', operating_days: [0, 1, 2, 3, 4] },
    { owner_id: getAdminId('Amr'), name: 'Vodafone Customer Care', name_ar: 'فودافون خدمة العملاء', description: 'Resolve your SIM issues, plan upgrades, and billing inquiries.', description_ar: 'حل مشاكل الشريحة وتحديث الباقة واستفسارات الفواتير.', category: 'telecom', address: 'Maadi, Cairo', address_ar: 'المعادي، القاهرة', image_url: '/telecom.jpg', operating_days: [0, 1, 2, 3, 4, 5] },
    { owner_id: getAdminId('Naglaa'), name: 'Alfa Medical Labs', name_ar: 'معامل ألفا الطبية', description: 'Precise medical testing and fast results for all your health needs.', description_ar: 'تحاليل طبية دقيقة ونتائج سريعة لجميع احتياجاتك الصحية.', category: 'clinic', address: 'Dokki, Giza', address_ar: 'الدقي، الجيزة', image_url: '/lab.jpg', operating_days: [0, 1, 2, 3, 4, 5] },
    { owner_id: getAdminId('Cinema'), name: 'City Stars Movie Center', name_ar: 'سينما سيتي ستارز', description: 'Book your tickets for the latest blockbusters in 12 premium screens.', description_ar: 'احجز تذكرتك لأحدث الأفلام على 12 شاشة عرض متميزة.', category: 'entertainment', address: 'Heliopolis, Cairo', address_ar: 'مصر الجديدة، القاهرة', image_url: '/cinema.jpg', operating_days: [0, 1, 2, 3, 4, 5, 6] },
    { owner_id: getAdminId('Bank'), name: 'Banque du Caire', name_ar: 'بنك القاهرة', description: 'Personal and business banking services including loans and accounts.', description_ar: 'خدمات مصرفية للأفراد والشركات تشمل القروض والحسابات.', category: 'bank', address: 'Garden City, Cairo', address_ar: 'جاردن سيتي، القاهرة', image_url: '/bank2.jpg', operating_days: [0, 1, 2, 3, 4] },
    { owner_id: getAdminId('Cafe'), name: 'Cilantro Stanley Coffee', name_ar: 'سيلانترو ستانلي', description: 'The best specialty coffee with a breathtaking view of Stanley Bridge.', description_ar: 'أفضل قهوة متخصصة مع إطلالة رائعة على كوبري ستانلي.', category: 'restaurant', address: 'Stanley, Alexandria', address_ar: 'ستانلي، الإسكندرية', image_url: '/cafe.jpg', operating_days: [0, 1, 2, 3, 4, 5, 6] },
    { owner_id: getAdminId('Museum'), name: 'Grand Egyptian Museum', name_ar: 'المتحف المصري الكبير', description: 'Discover the treasures of ancient Egypt at the world\'s largest archaeological museum.', description_ar: 'اكتشف كنوز مصر القديمة في أكبر متحف أثري في العالم.', category: 'tourism', address: 'Pyramids Plateau, Giza', address_ar: 'هضبة الأهرامات، الجيزة', image_url: '/museum.jpg', operating_days: [0, 1, 2, 3, 4, 5, 6] },
  ];

  const created: Array<{ id: number; name: string }> = [];

  for (const b of bizData) {
    if (!b.owner_id) {
      console.warn(`  ⚠️  Skipping "${b.name}" — no matching admin found`);
      continue;
    }

    const { data: existing } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('name', b.name)
      .maybeSingle();

    if (existing) {
      created.push(existing);
      console.log(`  ℹ️  "${b.name}" already exists`);
      continue;
    }

    const { data: biz, error } = await supabase
      .from('businesses')
      .insert(b)
      .select('id, name')
      .single();

    if (error) {
      console.error(`  ❌ Failed to create "${b.name}": ${error.message}`);
      continue;
    }

    created.push(biz);
    console.log(`  ✅ Created: ${b.name}`);
  }

  return created;
}

async function createQueues(businesses: Array<{ id: number; name: string }>) {
  const queueDefinitions: Record<string, Array<{ name: string; name_ar: string; avg_service_time_min: number }>> = {
    'Big Koshary Time!': [
      { name: 'Takeaway Line', name_ar: 'طابور الأكل السريع', avg_service_time_min: 2 },
      { name: 'Dine-In Tables', name_ar: 'طاولات الصالة', avg_service_time_min: 15 },
      { name: 'Online Orders Pickup', name_ar: 'استلام الطلبات أونلاين', avg_service_time_min: 5 },
    ],
    'Dr. Rabbie Clinic': [
      { name: 'General Consultation', name_ar: 'كشف عام', avg_service_time_min: 30 },
      { name: 'Pediatrics', name_ar: 'طب أطفال', avg_service_time_min: 25 },
      { name: 'Cardiology', name_ar: 'قلب', avg_service_time_min: 45 },
    ],
    'The Bureau of Stamps': [
      { name: 'Standard Service', name_ar: 'خدمة اعتيادية', avg_service_time_min: 20 },
      { name: 'Expedited Service', name_ar: 'خدمة عاجلة', avg_service_time_min: 10 },
      { name: 'Document Verification', name_ar: 'توثيق المستندات', avg_service_time_min: 35 },
    ],
    'Vodafone Customer Care': [
      { name: 'SIM Replacement', name_ar: 'استبدال الشريحة', avg_service_time_min: 10 },
      { name: 'Billing & Payments', name_ar: 'الفواتير والدفع', avg_service_time_min: 15 },
      { name: 'Technical Support', name_ar: 'دعم فني', avg_service_time_min: 25 },
    ],
    'Alfa Medical Labs': [
      { name: 'Blood Tests', name_ar: 'تحاليل دم', avg_service_time_min: 15 },
      { name: 'X-Ray & Imaging', name_ar: 'أشعة وتصوير', avg_service_time_min: 30 },
      { name: 'Results Collection', name_ar: 'استلام النتائج', avg_service_time_min: 5 },
    ],
    'City Stars Movie Center': [
      { name: 'Ticket Purchase', name_ar: 'شراء تذاكر', avg_service_time_min: 3 },
      { name: 'Snacks & Drinks', name_ar: 'وجبات خفيفة ومشروبات', avg_service_time_min: 5 },
      { name: 'VIP Lounge', name_ar: 'صالة كبار الزوار', avg_service_time_min: 2 },
    ],
    'Banque du Caire': [
      { name: 'Teller Services', name_ar: 'خدمات الصراف', avg_service_time_min: 15 },
      { name: 'Loans & Credit', name_ar: 'قروض وائتمان', avg_service_time_min: 40 },
      { name: 'Customer Service', name_ar: 'خدمة العملاء', avg_service_time_min: 20 },
    ],
    'Cilantro Stanley Coffee': [
      { name: 'Order Counter', name_ar: 'كاونتر الطلبات', avg_service_time_min: 5 },
      { name: 'Drive-Thru', name_ar: 'السيارة', avg_service_time_min: 3 },
    ],
    'Grand Egyptian Museum': [
      { name: 'General Admission', name_ar: 'دخول عام', avg_service_time_min: 10 },
      { name: 'Guided Tours', name_ar: 'جولات إرشادية', avg_service_time_min: 60 },
      { name: 'Special Exhibits', name_ar: 'معارض خاصة', avg_service_time_min: 20 },
    ],
  };

  const created: Array<{ id: number; name: string; business_id: number; avg_service_time_min: number }> = [];

  for (const biz of businesses) {
    const defs = queueDefinitions[biz.name] || [
      { name: 'General Entrance', name_ar: 'دخول عام', avg_service_time_min: 10 },
    ];

    for (const qDef of defs) {
      const { data: existing } = await supabase
        .from('queues')
        .select('id, name, business_id, avg_service_time_min')
        .eq('business_id', biz.id)
        .eq('name', qDef.name)
        .maybeSingle();

      if (existing) {
        created.push(existing);
        continue;
      }

      const { data: queue, error } = await supabase
        .from('queues')
        .insert({
          business_id: biz.id,
          name: qDef.name,
          name_ar: qDef.name_ar,
          is_open: true,
          avg_service_time_min: qDef.avg_service_time_min,
        })
        .select('id, name, business_id, avg_service_time_min')
        .single();

      if (error) {
        console.error(`  ❌ Failed to create queue "${qDef.name}": ${error.message}`);
        continue;
      }

      created.push(queue);
    }
  }

  console.log(`  ✅ Created ${created.length} queues`);
  return created;
}

async function createTicketHistory(
  queues: Array<{ id: number; name: string; business_id: number; avg_service_time_min: number }>,
  users: Array<{ id: number; name: string; role: string }>
) {
  const customers = users.filter(u => u.role === 'user');
  if (customers.length === 0) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  const statuses = ['done', 'done', 'done', 'done', 'done', 'done', 'done', 'skipped', 'cancelled'] as const;
  const dates = [today, today, today, yesterdayStr, yesterdayStr, yesterdayStr, twoDaysAgoStr, twoDaysAgoStr, twoDaysAgoStr];

  let ticketCount = 0;

  for (const queue of queues) {
    const ticketsForQueue = Math.floor(Math.random() * 8) + 5;

    for (let i = 0; i < ticketsForQueue; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const targetDate = dates[Math.floor(Math.random() * dates.length)];
      const isHistoric = targetDate !== today;

      const joinedAt = new Date(targetDate);
      joinedAt.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      const completedAt = status === 'done' || status === 'skipped' || status === 'cancelled'
        ? new Date(joinedAt.getTime() + (Math.floor(Math.random() * 120) + 5) * 60000)
        : null;

      const { data: existing } = await supabase
        .from('tickets')
        .select('id')
        .eq('queue_id', queue.id)
        .eq('user_id', customer.id)
        .eq('target_date', targetDate)
        .eq('ticket_number', i + 1)
        .maybeSingle();

      if (existing) continue;

      const { error } = await supabase.from('tickets').insert({
        queue_id: queue.id,
        user_id: customer.id,
        ticket_number: i + 1,
        status: isHistoric ? status : (i === 0 ? 'serving' : 'waiting'),
        target_date: targetDate,
        notify_settings: [15, 30],
        notified_events: isHistoric ? ['day_of', 15, 30] : ['day_of'],
        joined_at: joinedAt.toISOString(),
        called_at: isHistoric && (status === 'done' || status === 'skipped')
          ? new Date(joinedAt.getTime() + Math.floor(Math.random() * 60) * 60000).toISOString()
          : null,
        completed_at: completedAt?.toISOString() || null,
      });

      if (!error) {
        ticketCount++;

        if (completedAt) {
          await supabase.from('queue_logs').insert({
            queue_id: queue.id,
            ticket_id: null,
            action: status === 'done' ? 'call' : status,
            actor_id: customer.id,
            created_at: completedAt.toISOString(),
          });
        }
      }
    }
  }

  console.log(`  ✅ Created ${ticketCount} tickets with history`);
}

async function createNotifications(users: Array<{ id: number; name: string; role: string }>) {
  const notificationTemplates = [
    { title: 'Welcome to QueueLess!', message: 'Thank you for joining. Start exploring businesses and book your spot in line.' },
    { title: 'Your turn is approaching', message: 'You are approximately 15 minutes away from being called. Please make your way to the business.' },
    { title: 'It\'s your turn!', message: 'Please head to the front desk. Your ticket has been called.' },
    { title: 'Queue is moving fast', message: 'The queue is progressing quicker than expected! Estimated wait time has been reduced.' },
    { title: 'Appointment Reminder', message: 'You have a scheduled visit tomorrow. Don\'t forget to arrive on time.' },
    { title: 'Business Hours Update', message: 'The business you visited has updated its operating hours for next week.' },
    { title: 'Service Completed', message: 'Your service has been completed. We hope you had a great experience!' },
    { title: 'Rate Your Experience', message: 'How was your visit? Tap to rate the service you received today.' },
    { title: 'Queue Closed', message: 'The queue you were waiting in has been closed for today. Your ticket has been saved for tomorrow.' },
    { title: 'New Feature Available', message: 'You can now schedule appointments for future dates. Try it out!' },
  ];

  let notifCount = 0;

  for (const user of users) {
    const numNotifs = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < numNotifs; i++) {
      const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title: template.title,
        message: template.message,
        is_read: daysAgo > 0,
        created_at: createdAt.toISOString(),
      });

      if (!error) notifCount++;
    }
  }

  console.log(`  ✅ Created ${notifCount} notifications`);
}

seed().catch(console.error);
