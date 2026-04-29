import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FREE_PLAN_STORAGE_LIMIT = 500 * 1024 * 1024;
const FREE_PLAN_RETENTION_YEARS = 5;
const REFERRAL_BONUS_BYTES = 100 * 1024 * 1024;
const REFERRAL_FREE_CAP_BYTES = 1024 * 1024 * 1024;
const MAX_REFERRALS_PER_USER = 10;
const STORAGE_ALERT_THRESHOLDS = [80, 90, 100];
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "no-reply@ineedstorage.local";
let smtpTransporter = null;

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${units[i]}`;
};

const isSmtpConfigured = () => Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
const getSmtpTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (smtpTransporter) return smtpTransporter;
  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return smtpTransporter;
};

// Middleware with CORS configuration
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all in current setup; tighten in production if needed
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// File upload setup - using Memory Storage for Cloud Uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file (typical free tier limit)
  },
});

import { uploadFile, deleteFile, getFileStream } from './storage-service.js';

// Database file path


// Database adapter
import { initDB, readDB, writeDB, sync } from './db.js';

app.get('/api/admin/sync', async (req, res) => {
  try {
    await sync();
    res.json({ success: true, message: "Server memory synced from database successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const ensureDefaultSubscription = (db, userId) => {
  db.subscriptions = db.subscriptions || [];
  const activePlan = db.subscriptions.find((s) => s.userId === userId && s.status === 'active');
  if (activePlan) {
    if (activePlan.planType === 'free') {
      activePlan.planName = '500MB Free Storage - 5 Years';
      const start = activePlan.dateStarted ? new Date(activePlan.dateStarted) : new Date(activePlan.createdAt || Date.now());
      const expiry = new Date(start);
      expiry.setFullYear(expiry.getFullYear() + FREE_PLAN_RETENTION_YEARS);
      activePlan.dateExpires = expiry.toISOString();
    }
    return;
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + FREE_PLAN_RETENTION_YEARS);

  db.subscriptions.push({
    id: uuidv4().slice(0, 10),
    userId,
    planName: '500MB Free Storage - 5 Years',
    planType: 'free',
    quantity: 1,
    amount: 0,
    status: 'active',
    dateStarted: startedAt.toISOString(),
    dateExpires: expiresAt.toISOString(),
    createdAt: startedAt.toISOString(),
  });
};

const ensureUserDefaults = (user) => {
  if (!user) return;
  if (typeof user.isPremium !== 'boolean') user.isPremium = false;
  if (!user.isPremium) {
    const current = Number(user.storageLimit || 0);
    // Keep referral bonuses (or any higher free limit), never force back to 500MB.
    user.storageLimit = Math.max(FREE_PLAN_STORAGE_LIMIT, current);
  }
  if (typeof user.notificationEmail !== 'string') user.notificationEmail = "";
  if (!user.storageAlertState || typeof user.storageAlertState !== 'object') {
    user.storageAlertState = { 80: false, 90: false, 100: false };
  }
};

const generateUniqueReferralCode = (db, seed = "") => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const existing = new Set((db.users || []).map((u) => String(u.referralCode || "").toUpperCase()));
  const base = String(seed || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (base.length === 8 && !existing.has(base)) return base;
  for (let i = 0; i < 1000; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) code += chars[Math.floor(Math.random() * chars.length)];
    if (!existing.has(code)) return code;
  }
  return uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase();
};

const ensureUniqueReferralCode = (db, user) => {
  if (!user) return;
  const users = db.users || [];
  const code = String(user.referralCode || "").toUpperCase();
  const same = users.filter((u) => String(u.referralCode || "").toUpperCase() === code);
  if (!code || code.length !== 8 || same.length > 1) {
    user.referralCode = generateUniqueReferralCode(db, user.id);
  }
};

const resolveReferrerByCode = (db, referralCode) => {
  const code = String(referralCode || "").trim().toUpperCase();
  if (!code) return null;
  const users = (db.users || []).filter((u) => String(u.referralCode || "").toUpperCase() === code);
  if (users.length === 0) return null;
  // If duplicates exist, pick the most recently created account deterministically.
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return users[0];
};

const reconcileReferralOwnership = (db) => {
  db.referrals = db.referrals || [];
  if (!db.referrals.length) return;
  db.referrals.forEach((r) => {
    const owner = resolveReferrerByCode(db, r.referralCodeUsed);
    if (owner) r.referrerUserId = owner.id;
  });
};

const syncFreeUserReferralStorage = (db, user) => {
  if (!user || user.isPremium) return;
  db.referrals = db.referrals || [];
  reconcileReferralOwnership(db);
  const referralCount = db.referrals.filter((r) => r.referrerUserId === user.id).length;
  const calculated = Math.min(
    REFERRAL_FREE_CAP_BYTES,
    FREE_PLAN_STORAGE_LIMIT + referralCount * REFERRAL_BONUS_BYTES
  );
  const current = Number(user.storageLimit || 0);
  user.storageLimit = Math.max(current, calculated, FREE_PLAN_STORAGE_LIMIT);
};

const collectStorageAlerts = (db, user) => {
  if (!user) return [];
  db.alerts = db.alerts || [];
  ensureUserDefaults(user);
  const usedStorage = getUsedStorage(db, user.id);
  const storageLimit = Number(user.storageLimit || FREE_PLAN_STORAGE_LIMIT);
  const usagePct = storageLimit > 0 ? (usedStorage / storageLimit) * 100 : 0;
  const triggered = [];

  STORAGE_ALERT_THRESHOLDS.forEach((threshold) => {
    const key = String(threshold);
    const crossed = usagePct >= threshold;
    if (crossed && !user.storageAlertState[key]) {
      user.storageAlertState[key] = true;
      const alert = {
        id: uuidv4().slice(0, 12),
        userId: user.id,
        type: "storage_threshold",
        threshold,
        usedStorage,
        storageLimit,
        usagePct: Number(usagePct.toFixed(2)),
        email: user.notificationEmail || null,
        createdAt: new Date().toISOString(),
        deliveredAt: null,
        deliveryError: null,
      };
      db.alerts.push(alert);
      triggered.push(alert);
    } else if (!crossed && user.storageAlertState[key]) {
      user.storageAlertState[key] = false;
    }
  });

  return triggered;
};

const createAlertsForCurrentUsage = (db, user, reason = "manual") => {
  if (!user) return [];
  db.alerts = db.alerts || [];
  ensureUserDefaults(user);
  const usedStorage = getUsedStorage(db, user.id);
  const storageLimit = Number(user.storageLimit || FREE_PLAN_STORAGE_LIMIT);
  const usagePct = storageLimit > 0 ? (usedStorage / storageLimit) * 100 : 0;
  const created = [];

  STORAGE_ALERT_THRESHOLDS.forEach((threshold) => {
    if (usagePct < threshold) return;
    const alert = {
      id: uuidv4().slice(0, 12),
      userId: user.id,
      type: "storage_threshold",
      threshold,
      usedStorage,
      storageLimit,
      usagePct: Number(usagePct.toFixed(2)),
      email: user.notificationEmail || null,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      deliveryError: null,
      reason,
    };
    db.alerts.push(alert);
    created.push(alert);
  });

  return created;
};

const sendStorageAlertEmail = async (alert) => {
  if (!alert?.email) throw new Error("Notification email not set");
  const transporter = getSmtpTransporter();
  if (!transporter) throw new Error("SMTP is not configured");
  const usageLine = `${formatBytes(alert.usedStorage)} used of ${formatBytes(alert.storageLimit)} (${alert.usagePct}%)`;
  console.log(
    `[MAIL][TRY] sender=${SMTP_USER || "N/A"} from="${SMTP_FROM}" to=${alert.email} threshold=${alert.threshold}% usage=${alert.usagePct}%`
  );
  await transporter.sendMail({
    from: SMTP_FROM,
    to: alert.email,
    subject: `INeedStorage alert: ${alert.threshold}% storage used`,
    text: [
      "Your INeedStorage account is near capacity.",
      "",
      `Threshold reached: ${alert.threshold}%`,
      `Current usage: ${usageLine}`,
      "",
      "Recommended action: upgrade your plan or clean unused files.",
      "",
      "INeedStorage",
    ].join("\n"),
  });
};

const deliverPendingStorageAlerts = async (db, userId) => {
  db.alerts = db.alerts || [];
  const pending = db.alerts.filter(
    (a) => a.userId === userId && a.type === "storage_threshold" && !a.deliveredAt
  );
  for (const alert of pending) {
    try {
      await sendStorageAlertEmail(alert);
      alert.deliveredAt = new Date().toISOString();
      alert.deliveryError = null;
      console.log(
        `[MAIL][SENT] from="${SMTP_FROM}" to=${alert.email} threshold=${alert.threshold}% deliveredAt=${alert.deliveredAt}`
      );
    } catch (err) {
      alert.deliveryError = err.message || "Unknown email delivery error";
      console.error(
        `[MAIL][FAIL] from="${SMTP_FROM}" to=${alert.email || "N/A"} threshold=${alert.threshold}% error="${alert.deliveryError}"`
      );
    }
  }
};

const removeFileFromDisk = async (filename) => {
  if (!filename) return;
  try {
    await deleteFile(filename);
  } catch (err) {
    console.warn('Failed deleting file from cloud storage:', filename, err.message);
  }
};

const cleanupExpiredFreeFiles = (db, userId = null) => {
  db.users = db.users || [];
  db.files = db.files || [];
  const now = new Date();

  const freeUserIds = new Set(
    db.users
      .filter((u) => (userId ? u.id === userId : true))
      .filter((u) => !u.isPremium)
      .map((u) => u.id)
  );

  const filesToDelete = db.files.filter((f) => {
    // If we're only cleaning up free users, skip if not in set
    if (userId && !freeUserIds.has(f.userId)) return false;
    
    // Check expiration
    if (f.expiresAt) {
      return new Date(f.expiresAt) <= now;
    }
    
    // Fallback if expiresAt is missing
    const uploadedAt = f.uploadedAt ? new Date(f.uploadedAt) : null;
    if (!uploadedAt || Number.isNaN(uploadedAt.getTime())) return false;
    
    const fallbackExpiresAt = new Date(uploadedAt);
    const expiryDays = freeUserIds.has(f.userId) ? 7 : 30;
    fallbackExpiresAt.setDate(fallbackExpiresAt.getDate() + expiryDays);
    return fallbackExpiresAt <= now;
  });

  filesToDelete.forEach((f) => removeFileFromDisk(f.filename));
  if (filesToDelete.length > 0) {
    const ids = new Set(filesToDelete.map((f) => f.id));
    db.files = db.files.filter((f) => !ids.has(f.id));
  }

  return filesToDelete.length;
};

const getUsedStorage = (db, userId) =>
  (db.files || [])
    .filter((f) => f.userId === userId)
    .reduce((sum, f) => sum + (f.size || 0), 0);

const validateFreePlanStorage = (db, userId, additionalBytes = 0) => {
  const user = (db.users || []).find((u) => u.id === userId);
  if (!user) return { allowed: true, usedStorage: 0, storageLimit: FREE_PLAN_STORAGE_LIMIT };
  ensureUserDefaults(user);
  syncFreeUserReferralStorage(db, user);
  if (user.isPremium) {
    return { allowed: true, usedStorage: getUsedStorage(db, userId), storageLimit: Infinity };
  }
  const usedStorage = getUsedStorage(db, userId);
  const storageLimit = user.storageLimit || FREE_PLAN_STORAGE_LIMIT;
  const allowed = usedStorage + additionalBytes <= storageLimit;
  return { allowed, usedStorage, storageLimit };
};

// Middleware to verify user ID
const verifyUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  req.userId = userId;
  next();
};

// Routes

// GET generate-id - Generate a unique 16-character user ID
app.get('/api/generate-id', (req, res) => {
  try {
    const db = readDB();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id;
    let isUnique = false;
    
    while (!isUnique) {
      id = '';
      for (let i = 0; i < 16; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
      }
      if (!db.users.find(u => u.id === id)) {
        isUnique = true;
      }
    }
    
    res.json({ success: true, generatedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate ID' });
  }
});

// POST signup - Register new user
app.post('/api/signup', (req, res) => {
  try {
    const { userId, referralCode } = req.body;
    
    if (!userId || userId.length !== 16) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const db = readDB();
    db.referrals = db.referrals || [];
    const userExists = db.users.find(u => u.id === userId);

    if (userExists) {
      return res.status(409).json({ error: 'User ID already exists' });
    }

    const newUser = {
      id: userId,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isPremium: false,
      storageLimit: FREE_PLAN_STORAGE_LIMIT,
      referralCode: String(userId).slice(0, 8),
    };

    db.users.push(newUser);
    ensureDefaultSubscription(db, userId);

    let referralApplied = false;
    const cleanedReferral = String(referralCode || '').trim().toUpperCase();
    if (cleanedReferral) {
      const referrer = resolveReferrerByCode(db, cleanedReferral);
      if (referrer && referrer.id !== userId) {
        const alreadyTracked = db.referrals.some((r) => r.referredUserId === userId);
        const referrerCount = db.referrals.filter((r) => r.referrerUserId === referrer.id).length;
        if (!alreadyTracked && referrerCount < MAX_REFERRALS_PER_USER) {
          if (!referrer.isPremium) {
            const currentLimit = referrer.storageLimit || FREE_PLAN_STORAGE_LIMIT;
            referrer.storageLimit = Math.min(
              REFERRAL_FREE_CAP_BYTES,
              currentLimit + REFERRAL_BONUS_BYTES
            );
          }
          db.referrals.push({
            id: uuidv4().slice(0, 10),
            referrerUserId: referrer.id,
            referredUserId: userId,
            referralCodeUsed: cleanedReferral,
            bonusBytes: REFERRAL_BONUS_BYTES,
            createdAt: new Date().toISOString(),
          });
          referralApplied = true;
        }
      }
    }

    writeDB(db);

    res.status(201).json({ success: true, user: newUser, referralApplied });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST login - Verify user exists
app.post('/api/login', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId || userId.length !== 16) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    ensureUserDefaults(user);
    ensureUniqueReferralCode(db, user);
    syncFreeUserReferralStorage(db, user);
    cleanupExpiredFreeFiles(db, userId);
    // Calculate user's current storage
    const userFiles = db.files.filter(f => f.userId === userId);
    const usedStorage = userFiles.reduce((sum, file) => sum + file.size, 0);
    user.lastLoginAt = new Date().toISOString();
    ensureDefaultSubscription(db, userId);
    collectStorageAlerts(db, user);
    deliverPendingStorageAlerts(db, userId).catch(console.error);
    writeDB(db);

    res.json({ success: true, user: { ...user, usedStorage } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH change account ID (migrate ownership to new ID)
app.patch('/api/account/id', verifyUser, (req, res) => {
  try {
    const oldUserId = req.userId;
    const { newUserId } = req.body || {};
    const cleanedNewId = String(newUserId || '').trim().toUpperCase();

    if (!cleanedNewId || cleanedNewId.length !== 16) {
      return res.status(400).json({ error: 'New Account ID must be exactly 16 characters' });
    }
    if (cleanedNewId === oldUserId) {
      return res.json({ success: true, userId: cleanedNewId, message: 'Account ID unchanged' });
    }

    const db = readDB();
    db.users = db.users || [];
    db.files = db.files || [];
    db.directories = db.directories || [];
    db.uploadLinks = db.uploadLinks || [];
    db.subscriptions = db.subscriptions || [];

    const currentUser = db.users.find((u) => u.id === oldUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const targetExists = db.users.some((u) => u.id === cleanedNewId);
    if (targetExists) {
      return res.status(409).json({ error: 'New Account ID already exists' });
    }

    // Migrate user and all owned records to the new ID
    currentUser.id = cleanedNewId;
    ensureUniqueReferralCode(db, currentUser);
    db.files.forEach((f) => {
      if (f.userId === oldUserId) f.userId = cleanedNewId;
    });
    db.directories.forEach((d) => {
      if (d.userId === oldUserId) d.userId = cleanedNewId;
    });
    db.uploadLinks.forEach((l) => {
      if (l.userId === oldUserId) l.userId = cleanedNewId;
    });
    db.subscriptions.forEach((s) => {
      if (s.userId === oldUserId) s.userId = cleanedNewId;
    });

    ensureUserDefaults(currentUser);
    ensureDefaultSubscription(db, cleanedNewId);
    reconcileReferralOwnership(db);
    writeDB(db);

    res.json({
      success: true,
      userId: cleanedNewId,
      message: 'Account ID updated successfully',
    });
  } catch (err) {
    console.error('Change account ID error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET active subscriptions + login info
app.get('/api/subscriptions/active', verifyUser, (req, res) => {
  try {
    const db = readDB();
    db.subscriptions = db.subscriptions || [];
    ensureDefaultSubscription(db, req.userId);
    cleanupExpiredFreeFiles(db, req.userId);

    const now = new Date();
    const activeSubscriptions = db.subscriptions.filter(
      (s) =>
        s.userId === req.userId &&
        s.status === 'active' &&
        (!s.dateExpires || new Date(s.dateExpires) >= now)
    );
    const user = (db.users || []).find((u) => u.id === req.userId) || null;

    writeDB(db);
    res.json({
      success: true,
      lastLoginAt: user?.lastLoginAt || null,
      activeSubscriptions,
    });
  } catch (err) {
    console.error('Active subscriptions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE account and all associated data (requires explicit confirmation)
app.delete('/api/account', verifyUser, async (req, res) => {
  try {
    const { confirmText } = req.body || {};
    if (confirmText !== 'CONFIRM') {
      return res.status(400).json({ error: 'Type CONFIRM to delete account' });
    }

    const db = readDB();
    const userFiles = (db.files || []).filter((f) => f.userId === req.userId);

    // Delete owned files from cloud storage
    for (const file of userFiles) {
      await removeFileFromDisk(file.filename);
    }

    // Remove all account data from DB
    db.users = (db.users || []).filter((u) => u.id !== req.userId);
    db.files = (db.files || []).filter((f) => f.userId !== req.userId);
    db.directories = (db.directories || []).filter((d) => d.userId !== req.userId);
    db.uploadLinks = (db.uploadLinks || []).filter((l) => l.userId !== req.userId);

    writeDB(db);

    res.json({
      success: true,
      message: 'Account and all related files/folders deleted permanently',
      deleted: {
        files: userFiles.length,
      },
    });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all files for authenticated user (graceful when no user header provided)
app.get('/api/files', (req, res) => {
  const db = readDB();
  const now = new Date();

  const userId = req.headers['x-user-id'];
  if (!userId) {
    // No user header — return empty list instead of error to avoid noisy client failures
    return res.json([]);
  }

  cleanupExpiredFreeFiles(db, userId);

  // Filter files by user ID and remove expired files
  let userFiles = db.files.filter(
    file => file.userId === userId && new Date(file.expiresAt) > now
  );

  // Optional directory filter
  const { directoryId } = req.query;
  if (directoryId) {
    userFiles = userFiles.filter(f => (f.directoryId || null) === directoryId);
  }

  // Update DB to remove expired files
  const activeFiles = db.files.filter(file => new Date(file.expiresAt) > now);
  if (activeFiles.length !== db.files.length) {
    writeDB({ ...db, files: activeFiles });
  } else {
    writeDB(db);
  }

  res.json(userFiles);
});

// GET user storage info
app.get('/api/storage', verifyUser, async (req, res) => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    ensureUserDefaults(user);
    ensureUniqueReferralCode(db, user);
    syncFreeUserReferralStorage(db, user);
    collectStorageAlerts(db, user);
    deliverPendingStorageAlerts(db, req.userId).catch(console.error);
    cleanupExpiredFreeFiles(db, req.userId);
    const userFiles = db.files.filter(f => f.userId === req.userId);
    const usedStorage = userFiles.reduce((sum, file) => sum + file.size, 0);

    writeDB(db);
    res.json({
      userId: req.userId,
      isPremium: user.isPremium || false,
      storageLimit: user.storageLimit || FREE_PLAN_STORAGE_LIMIT,
      usedStorage,
      remainingStorage: (user.storageLimit || FREE_PLAN_STORAGE_LIMIT) - usedStorage,
      notificationEmail: user.notificationEmail || "",
    });
  } catch (err) {
    console.error('Storage info error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/email', verifyUser, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim();
    const db = readDB();
    const user = (db.users || []).find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    ensureUserDefaults(user);
    const previousEmail = String(user.notificationEmail || "").trim().toLowerCase();
    const nextEmail = String(email || "").trim().toLowerCase();
    user.notificationEmail = email;
    collectStorageAlerts(db, user);
    if (nextEmail && previousEmail !== nextEmail) {
      createAlertsForCurrentUsage(db, user, "email_updated");
    }
    deliverPendingStorageAlerts(db, req.userId).catch(console.error);
    writeDB(db);
    res.json({ success: true, notificationEmail: user.notificationEmail });
  } catch (err) {
    console.error('Update notification email error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/alerts', verifyUser, (req, res) => {
  try {
    const db = readDB();
    db.alerts = db.alerts || [];
    const alerts = db.alerts
      .filter((a) => a.userId === req.userId && a.type === "storage_threshold")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json({ success: true, alerts });
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET referral list and bonus summary for authenticated user
app.get('/api/referrals', verifyUser, (req, res) => {
  try {
    const db = readDB();
    db.referrals = db.referrals || [];
    const user = (db.users || []).find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    ensureUserDefaults(user);
    ensureUniqueReferralCode(db, user);
    syncFreeUserReferralStorage(db, user);

    const referrals = db.referrals
      .filter((r) => r.referrerUserId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    writeDB(db);
    res.json({
      success: true,
      referralCode: user.referralCode || String(user.id).slice(0, 8),
      totalReferrals: referrals.length,
      totalBonusBytes: referrals.reduce((sum, r) => sum + (r.bonusBytes || 0), 0),
      currentStorageLimit: user.storageLimit || FREE_PLAN_STORAGE_LIMIT,
      referrals,
    });
  } catch (err) {
    console.error('Referrals error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload file (authenticated)
// Accept any file field name to be tolerant of different client form field names
app.post('/api/upload', verifyUser, upload.any(), async (req, res) => {
  try {
    console.log(`Upload request from user=${req.userId}, files=${(req.files||[]).length}, directory=${req.body.directoryId || 'root'}`);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { notes, location } = req.body;
    const { directoryId } = req.body;
    const db = readDB();
    
    // Get or create user
    let user = db.users.find(u => u.id === req.userId);
    if (!user) {
      user = {
        id: req.userId,
        createdAt: new Date().toISOString(),
        isPremium: false,
        storageLimit: FREE_PLAN_STORAGE_LIMIT,
      };
      db.users.push(user);
    }
    ensureUserDefaults(user);
    cleanupExpiredFreeFiles(db, req.userId);

    const existingFiles = db.files.filter(f => f.userId === req.userId);
    const duplicates = [];
    const newFiles = [];

    req.files.forEach((file) => {
      const dup = existingFiles.find(f => f.name === file.originalname && f.size === file.size);
      if (dup) {
        duplicates.push(file);
      } else {
        newFiles.push(file);
      }
    });

    if (!user.isPremium) {
      const uploadSize = newFiles.reduce((sum, file) => sum + file.size, 0);
      const storageCheck = validateFreePlanStorage(db, req.userId, uploadSize);
      if (!storageCheck.allowed) {
        return res.status(403).json({
          error: 'Storage limit exceeded',
          message: `Free account limited to ${formatBytes(storageCheck.storageLimit)}.`,
          usedStorage: storageCheck.usedStorage,
          storageLimit: storageCheck.storageLimit,
          requiresUpgrade: true,
        });
      }
    }

    const uploadedFiles = [];

    // Process new files
    for (const file of newFiles) {
      const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
      
      // Upload to Cloud Storage
      const cloudFile = await uploadFile(file.buffer, uniqueName, file.mimetype);

      const expiresAt = new Date();
      const expiryDays = user.isPremium ? 30 : 7;
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const fileEntry = {
        id: uuidv4(),
        userId: req.userId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        filename: uniqueName, // This is the key in storage
        url: cloudFile.url,
        directoryId: directoryId || null,
        uploadedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'completed',
        notes: notes || null,
        location: location || 'Central Europe',
        views: 0,
        downloads: 0,
      };

      db.files.push(fileEntry);
      uploadedFiles.push(fileEntry);
    }

    const resultPayload = { success: true, files: uploadedFiles };
    if (duplicates.length > 0) {
      resultPayload.duplicatesSkipped = duplicates.map(d => ({ name: d.originalname, size: d.size }));
    }

    const currentUser = (db.users || []).find((u) => u.id === req.userId);
    if (currentUser) collectStorageAlerts(db, currentUser);
    deliverPendingStorageAlerts(db, req.userId).catch(console.error);
    writeDB(db);
    res.json(resultPayload);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

  // POST create directory
  app.post('/api/directories', verifyUser, (req, res) => {
    try {
      const { name, parentId = null } = req.body;
      if (!name || String(name).trim().length === 0) {
        return res.status(400).json({ error: 'Directory name required' });
      }

      const db = readDB();
      db.directories = db.directories || [];
      const user = (db.users || []).find((u) => u.id === req.userId);
      if (user) {
        ensureUserDefaults(user);
        cleanupExpiredFreeFiles(db, req.userId);
        const storageCheck = validateFreePlanStorage(db, req.userId, 0);
        if (!storageCheck.allowed) {
          return res.status(403).json({
            error: 'Storage limit exceeded',
            message: 'Free plan (500MB) is full. You cannot add more folders/files/upload-link uploads.',
            usedStorage: storageCheck.usedStorage,
            storageLimit: storageCheck.storageLimit,
          });
        }
      }

      const dir = {
        id: uuidv4(),
        userId: req.userId,
        name: String(name).trim(),
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
      };

      db.directories.push(dir);
      writeDB(db);

      res.status(201).json({ success: true, directory: dir });
    } catch (err) {
      console.error('Create directory error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET list directories (graceful when no user header provided)
  app.get('/api/directories', (req, res) => {
    try {
      const db = readDB();
      const userId = req.headers['x-user-id'];
      if (!userId) return res.json([]);
      const dirs = (db.directories || []).filter(d => d.userId === userId);
      res.json(dirs);
    } catch (err) {
      console.error('Get directories error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE directory (authenticated - only owner can delete)
  app.delete('/api/directories/:id', verifyUser, async (req, res) => {
    try {
      const { id } = req.params;
      const db = readDB();
      db.directories = db.directories || [];

      const dir = db.directories.find((d) => d.id === id);
      if (!dir) {
        return res.status(404).json({ error: 'Directory not found' });
      }
      if (dir.userId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Delete target directory recursively (all child folders and files).
      const directoryIdsToDelete = new Set([id]);
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        (db.directories || []).forEach((d) => {
          if (d.userId === req.userId && d.parentId && directoryIdsToDelete.has(d.parentId) && !directoryIdsToDelete.has(d.id)) {
            directoryIdsToDelete.add(d.id);
            foundNew = true;
          }
        });
      }

      // Remove related files from cloud storage and DB
      const filesToDelete = (db.files || []).filter(
        (f) => f.userId === req.userId && f.directoryId && directoryIdsToDelete.has(f.directoryId)
      );
      for (const file of filesToDelete) {
        await removeFileFromDisk(file.filename);
      }

      db.files = (db.files || []).filter(
        (f) => !(f.userId === req.userId && f.directoryId && directoryIdsToDelete.has(f.directoryId))
      );
      db.directories = (db.directories || []).filter(
        (d) => !(d.userId === req.userId && directoryIdsToDelete.has(d.id))
      );
      writeDB(db);
      res.json({
        success: true,
        deleted: {
          directories: directoryIdsToDelete.size,
          files: filesToDelete.length,
        },
      });
    } catch (err) {
      console.error('Delete directory error:', err);
      res.status(500).json({ error: err.message });
    }
  });

// POST create upload link (authenticated)
app.post('/api/upload-links', verifyUser, (req, res) => {
  try {
    const { maxUploads = 9999, expiryDays = 7 } = req.body;
    const db = readDB();
    db.uploadLinks = db.uploadLinks || [];
    const user = (db.users || []).find((u) => u.id === req.userId);
    if (user) {
      ensureUserDefaults(user);
      cleanupExpiredFreeFiles(db, req.userId);
      const storageCheck = validateFreePlanStorage(db, req.userId, 0);
      if (!storageCheck.allowed) {
        return res.status(403).json({
          error: 'Storage limit exceeded',
            message: `Free plan (${formatBytes(storageCheck.storageLimit)}) is full. You cannot add more upload-link uploads.`,
          usedStorage: storageCheck.usedStorage,
          storageLimit: storageCheck.storageLimit,
        });
      }
    }

    const linkId = Math.random().toString(36).substring(2, 11); // Generate short random ID
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const uploadLink = {
      id: linkId,
      userId: req.userId,
      maxUploads,
      currentUploads: 0,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    db.uploadLinks.push(uploadLink);
    writeDB(db);

    res.status(201).json({ success: true, uploadLink, linkUrl: `${req.protocol}://${req.get('host')}/upload/${linkId}` });
  } catch (err) {
    console.error('Create upload link error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET upload link info (public - no auth required)
app.get('/api/upload-links/:linkId', (req, res) => {
  try {
    const { linkId } = req.params;
    const db = readDB();
    db.uploadLinks = db.uploadLinks || [];

    const link = db.uploadLinks.find(l => l.id === linkId);
    if (!link) return res.status(404).json({ error: 'Upload link not found' });

    const now = new Date();
    if (new Date(link.expiresAt) < now) {
      return res.status(410).json({ error: 'Upload link expired' });
    }

    res.json({ success: true, uploadLink: link });
  } catch (err) {
    console.error('Get upload link error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET files uploaded via a specific upload link (public)
app.get('/api/upload-links/:linkId/files', (req, res) => {
  try {
    const { linkId } = req.params;
    const db = readDB();
    db.uploadLinks = db.uploadLinks || [];
    db.files = db.files || [];

    const link = db.uploadLinks.find((l) => l.id === linkId);
    if (!link) return res.status(404).json({ error: 'Upload link not found' });

    const files = db.files
      .filter((f) => f.uploadLinkId === linkId)
      .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

    res.json({ success: true, files });
  } catch (err) {
    console.error('Get upload link files error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all upload links for authenticated user
app.get('/api/upload-links', verifyUser, (req, res) => {
  try {
    const db = readDB();
    db.uploadLinks = db.uploadLinks || [];
    db.files = db.files || [];
    const now = new Date();
    const userLinks = db.uploadLinks.filter(
      (l) => l.userId === req.userId && new Date(l.expiresAt) >= now
    );
    const enriched = userLinks.map((link) => {
      const linkFiles = db.files.filter((f) => f.uploadLinkId === link.id);
      const filesCount = linkFiles.length;
      const occupiedBytes = linkFiles.reduce((sum, f) => sum + (f.size || 0), 0);
      return { ...link, filesCount, occupiedBytes };
    });
    res.json(enriched);
  } catch (err) {
    console.error('List upload links error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST upload via link (public - no auth required)
app.post('/api/upload-links/:linkId/upload', upload.any(), async (req, res) => {
  try {
    const { linkId } = req.params;
    const { notes, location } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const db = readDB();
    db.uploadLinks = db.uploadLinks || [];
    const link = db.uploadLinks.find(l => l.id === linkId);

    if (!link) return res.status(404).json({ error: 'Upload link not found' });
    const linkOwner = (db.users || []).find((u) => u.id === link.userId);
    if (linkOwner) {
      ensureUserDefaults(linkOwner);
      cleanupExpiredFreeFiles(db, link.userId);
    }

    const now = new Date();
    if (new Date(link.expiresAt) < now) {
      return res.status(410).json({ error: 'Upload link expired' });
    }

    if (link.currentUploads + req.files.length > link.maxUploads) {
      return res.status(429).json({ error: 'Upload limit reached for this link' });
    }

    const uploadSize = (req.files || []).reduce((sum, f) => sum + (f.size || 0), 0);
    const storageCheck = validateFreePlanStorage(db, link.userId, uploadSize);
    if (!storageCheck.allowed) {
      return res.status(403).json({
        error: 'Storage limit exceeded',
        message: `Free account limited to ${formatBytes(storageCheck.storageLimit)} for 5 years. You have used ${formatBytes(storageCheck.usedStorage)} of ${formatBytes(storageCheck.storageLimit)}.`,
        usedStorage: storageCheck.usedStorage,
        storageLimit: storageCheck.storageLimit,
      });
    }

    const isPremium = linkOwner?.isPremium || false;

    const uploadedFiles = [];
    for (const file of req.files) {
      const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;

      // Upload to Cloud Storage
      const cloudFile = await uploadFile(file.buffer, uniqueName, file.mimetype);

      const expiresAt = new Date();
      const expiryDays = isPremium ? 30 : 7;
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const fileEntry = {
        id: uuidv4(),
        userId: link.userId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        filename: uniqueName,
        url: cloudFile.url,
        uploadedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'completed',
        notes: notes || null,
        location: location || 'Central Europe',
        views: 0,
        downloads: 0,
        uploadLinkId: linkId,
      };

      db.files.push(fileEntry);
      uploadedFiles.push(fileEntry);
    }

    link.currentUploads += req.files.length;
    const linkOwnerUpdated = (db.users || []).find((u) => u.id === link.userId);
    if (linkOwnerUpdated) collectStorageAlerts(db, linkOwnerUpdated);
    deliverPendingStorageAlerts(db, link.userId).catch(console.error);
    writeDB(db);

    res.json({ success: true, files: uploadedFiles, message: `${uploadedFiles.length} file(s) uploaded` });
  } catch (err) {
    console.error('Upload via link error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE file (authenticated - only owner can delete)
app.delete('/api/files/:id', verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const file = db.files.find(f => f.id === id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify file belongs to user
    if (file.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete file from cloud/local storage
    await removeFileFromDisk(file.filename);

    // Remove from database
    db.files = db.files.filter(f => f.id !== id);
    writeDB(db);

    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH update file metadata (authenticated - only owner can edit)
app.patch('/api/files/:id', verifyUser, (req, res) => {
  try {
    const { id } = req.params;
    const { name, notes, directoryId } = req.body;
    const db = readDB();
    const file = db.files.find(f => f.id === id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Backwards compatibility: older records may not have userId.
    // If missing, attach current user as owner. Otherwise enforce ownership.
    if (!file.userId) {
      file.userId = req.userId;
    } else if (file.userId !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (typeof name === 'string' && name.trim().length > 0) {
      file.name = name.trim();
    }
    if (typeof notes === 'string' || notes === null) {
      file.notes = notes;
    }
    if (directoryId !== undefined) {
      if (directoryId === null || directoryId === '' || directoryId === 'root') {
        file.directoryId = null;
      } else {
        const dirExists = (db.directories || []).some(
          (d) => d.id === directoryId && d.userId === req.userId
        );
        if (!dirExists) {
          return res.status(400).json({ error: 'Invalid directory' });
        }
        file.directoryId = directoryId;
      }
    }

    writeDB(db);
    res.json({ success: true, file });
  } catch (err) {
    console.error('Update file error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD file (increments download count)
app.get('/api/files/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const file = db.files.find(f => f.id === id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count
    file.downloads = (file.downloads || 0) + 1;
    writeDB(db);

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.type || 'application/octet-stream');

    const stream = await getFileStream(file.filename);
    stream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET file detail (increments view count)
app.get('/api/files/:id/info', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const file = db.files.find(f => f.id === id);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment view count
    file.views = (file.views || 0) + 1;
    writeDB(db);

    res.json(file);
  } catch (err) {
    console.error('File info error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET upload links for authenticated user (graceful when no user header)
app.get('/api/upload-links', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      // No auth header – return empty list instead of error to keep UI clean
      return res.json([]);
    }
    const db = readDB();
    const links = (db.uploadLinks || []).filter(l => l.userId === userId);
    const files = db.files || [];
    const enriched = links.map((link) => {
      const linkFiles = files.filter((f) => f.uploadLinkId === link.id);
      const filesCount = linkFiles.length;
      const occupiedBytes = linkFiles.reduce((sum, f) => sum + (f.size || 0), 0);
      return { ...link, filesCount, occupiedBytes };
    });
    res.json(enriched);
  } catch (err) {
    console.error('List upload links error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/stats/global', (req, res) => {
  const db = readDB();
  res.json({
    totalUploads: db.files ? db.files.length : 0,
    totalUsers: db.users ? db.users.length : 0
  });
});

// SPEEDTEST - Download speed test endpoint
// Streams a fixed amount of random data to client
app.options('/api/speedtest/download', cors());
app.get('/api/speedtest/download', cors(), (req, res) => {
  try {
    const requestedMb = Number(req.query.mb || 25);
    const totalBytes = Math.max(1, Math.min(512, requestedMb)) * 1024 * 1024;
    const chunkSize = 64 * 1024; // 64KB chunks
    const chunk = Buffer.alloc(chunkSize);
    let sentBytes = 0;

    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Speedtest-Bytes', String(totalBytes));

    // Stream data until requested size is sent or client closes
    let isActive = true;

    const streamData = () => {
      if (!isActive) return;
      if (sentBytes >= totalBytes) {
        isActive = false;
        return res.end();
      }

      // Fill chunk with random data
      crypto.randomFillSync(chunk);

      const remaining = totalBytes - sentBytes;
      const slice = remaining < chunkSize ? chunk.subarray(0, remaining) : chunk;
      sentBytes += slice.length;

      if (!res.write(slice)) {
        res.once('drain', streamData);
      } else {
        setImmediate(streamData);
      }
    };

    res.on('close', () => {
      isActive = false;
    });

    res.on('error', (err) => {
      console.error('Download stream error:', err);
      isActive = false;
    });

    streamData();
  } catch (err) {
    console.error('Speed test download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SPEEDTEST - Upload speed test endpoint
// Accepts file upload and measures speed (uses memory storage, buffer is discarded automatically)
app.options('/api/speedtest/upload', cors());
app.post('/api/speedtest/upload', cors(), upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileSize = req.file.size;
    const timestamp = Date.now();
    
    // With memoryStorage, buffer is already in memory — just discard it (no disk cleanup needed)
    
    res.json({
      success: true,
      bytesUploaded: fileSize,
      timestamp,
    });
  } catch (err) {
    console.error('Speed test upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    console.error('Multer error:', err);
    return res.status(400).json({ error: err.message, code: err.code });
  }
  if (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
  next();
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA catch-all: serve index.html for any non-API route
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
  console.log(`✓ Serving frontend from ${distPath}`);
}

const processExpiredSubscriptions = async () => {
  try {
    const db = readDB();
    if (!db.subscriptions || !db.users) return;

    let modified = false;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const sub of db.subscriptions) {
      if (sub.status === 'active' && sub.dateExpires) {
        if (new Date(sub.dateExpires) < sevenDaysAgo) {
          sub.status = 'expired'; // mark expired
          modified = true;

          const user = db.users.find(u => u.id === sub.userId);
          if (user && user.email) {
            const transporter = getSmtpTransporter();
            if (transporter) {
              await transporter.sendMail({
                from: SMTP_FROM,
                to: user.email,
                subject: `INeedStorage: Subscription Expired`,
                text: `Hello,\n\nYour INeedStorage subscription (${sub.planName || "Storage Plan"}) expired 7 days ago.\nYour account limits have returned to the free plan.\n\nThank you,\nINeedStorage`
              }).catch(console.error);
            }
          }
        }
      }
    }

    if (modified) writeDB(db);
  } catch (err) {
    console.error('Error processing expired subs:', err);
  }
};

// Check for expired subs every hour
setInterval(processExpiredSubscriptions, 60 * 60 * 1000);

// Initialize DB and start server
await initDB();
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Storage: ${process.env.AWS_S3_BUCKET ? 'Cloud (R2)' : 'Local uploads/'}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
server.requestTimeout = 0;
server.headersTimeout = 0;

export default app;
