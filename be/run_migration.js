const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'mistletoe_secret',
  database: 'kiosk_db',
});
client.connect().then(async () => {
  const sql = fs.readFileSync('/home/numpyh/Documents/github_project/kiosk/be/src/migrations/refactor/001_remove_auth.sql', 'utf8');
  await client.query(sql);
  console.log('Migration successful');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});
