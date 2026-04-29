import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'ineedstorage';

const TABLES = [
  'users',
  'files',
  'directories',
  'uploadLinks',
  'subscriptions',
  'alerts',
  'referrals'
];

async function migrate() {
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env');
    process.exit(1);
  }

  if (!fs.existsSync(dbPath)) {
    console.error('Error: db.json not found. Nothing to migrate.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    console.log('Connected.');

    const localData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    for (const table of TABLES) {
      const items = localData[table] || [];
      if (items.length === 0) {
        console.log(`Skipping empty table: ${table}`);
        continue;
      }

      console.log(`Migrating ${items.length} items to ${table}...`);
      const collection = db.collection(table);
      
      // Upsert each item
      for (const item of items) {
        if (!item.id) continue;
        await collection.updateOne({ id: item.id }, { $set: item }, { upsert: true });
      }
      console.log(`Table ${table} migrated.`);
    }

    console.log('Migration successfully completed!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrate();
