import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'queueless'
});

async function testArabic() {
  try {
    console.log('Testing Arabic support...');
    
    // Insert a test user with Arabic name/city
    const res = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, city, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, ['أحمد محمد', 'ahmed@test.com', 'hashed', 'user', 'القاهرة', 'وسط البلد']);

    console.log('Inserted user:', res.rows[0]);

    // Query it back
    const search = await pool.query('SELECT * FROM users WHERE name = $1', ['أحمد محمد']);
    console.log('Queried user:', search.rows[0]);

    // Clean up
    await pool.query('DELETE FROM users WHERE email = $1', ['ahmed@test.com']);
    console.log('Cleanup done.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

testArabic();
