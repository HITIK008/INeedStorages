import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const DB_TYPE = process.env.DB_TYPE || 'mongo'; // 'json' (local dev), 'mongo' (production)

let adapter;

if (DB_TYPE === 'mongo') {
  adapter = await import('./mongodb-adapter.js');
} else {
  // Local JSON file for development only
  adapter = {
    initDB: async () => console.log('Using local JSON DB'),
    readDB: () => {
      try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));
      } catch (e) { return { users: [], files: [] }; }
    },
    writeDB: (data) => {
      try {
        fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(data, null, 2));
      } catch (e) {}
    }
  };
}

export const { initDB, readDB, writeDB, syncFromDB } = adapter;
export const sync = syncFromDB || (async () => true);
