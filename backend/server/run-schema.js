require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const sql = fs.readFileSync('db/schema.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Tables created!');
  await client.end();
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});