import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'ineedstorage';

let client;
let db;

const TABLES = [
  'users',
  'files',
  'directories',
  'uploadLinks',
  'subscriptions',
  'alerts',
  'referrals'
];

let memoryDb = {
  users: [],
  files: [],
  directories: [],
  uploadLinks: [],
  subscriptions: [],
  alerts: [],
  referrals: []
};

export async function initDB() {
  if (!uri) {
    console.warn('MONGODB_URI not found in environment variables. Falling back to memory-only mode.');
    return;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB Atlas');

    // Load data from MongoDB into memory for synchronous access (json-server style)
    for (const table of TABLES) {
      const collection = db.collection(table);
      const items = await collection.find({}).toArray();
      memoryDb[table] = items;
    }
    console.log('Data loaded from MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  }
}

export function readDB() {
  return JSON.parse(JSON.stringify(memoryDb));
}

export function writeDB(newData) {
  if (!newData || !db) return;
  
  const oldData = memoryDb;
  memoryDb = JSON.parse(JSON.stringify(newData));

  // Async sync to MongoDB
  for (const table of TABLES) {
    const oldArr = oldData[table] || [];
    const newArr = newData[table] || [];
    const collection = db.collection(table);

    const oldMap = new Map(oldArr.map(i => [i.id, i]));
    const newMap = new Map(newArr.map(i => [i.id, i]));

    // Update or Insert
    for (const [id, item] of newMap.entries()) {
      if (!id) continue;
      if (!oldMap.has(id) || JSON.stringify(oldMap.get(id)) !== JSON.stringify(item)) {
        collection.updateOne({ id }, { $set: item }, { upsert: true }).catch(console.error);
      }
    }

    // Delete
    for (const [id] of oldMap.entries()) {
      if (!id) continue;
      if (!newMap.has(id)) {
        collection.deleteOne({ id }).catch(console.error);
      }
    }
  }
}

export async function syncFromDB() {
  if (!db) return;
  for (const table of TABLES) {
    const collection = db.collection(table);
    memoryDb[table] = await collection.find({}).toArray();
  }
  return true;
}
