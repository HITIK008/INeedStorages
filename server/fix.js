import { initDB, writeDB, readDB } from './dynamodb-adapter.js';

async function fix() {
  await initDB();
  const db = readDB();
  const user = db.users.find(u => u.id === "XR76QXUYUNJ4E21J");
  if (user) {
    user.isPremium = true;
    user.storageLimit = 5 * 1024 * 1024 * 1024 * 1024; // 5TB
    console.log("Upgraded user!");
  }
  
  // also make sure subscription is valid
  const sub = db.subscriptions.find(s => s.userId === "XR76QXUYUNJ4E21J" && s.id === "123");
  if (sub) {
    sub.status = 'active';
    sub.planType = 'custom';
    sub.quantity = 5;
    const now = new Date();
    sub.dateStarted = now.toISOString();
    now.setMonth(now.getMonth() + 6);
    sub.dateExpires = now.toISOString();
    console.log("Fixed subscription!");
  }

  writeDB(db);
  console.log("Saved to DynamoDB.");
}
fix();
