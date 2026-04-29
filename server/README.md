# INeedStorage Backend Server

## Architecture

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend API | Render (Node.js) |
| Database | MongoDB Atlas (M0 Free) |
| File Storage | Cloudflare R2 |

---

## Local Development

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Key settings for local dev:
- `DB_TYPE=json` — uses local `db.json` instead of MongoDB
- Leave `AWS_*` vars empty — files save to local `uploads/` folder

### 3. Start the Server

```bash
npm start        # Production mode
npm run dev      # Development mode (auto-reload)
```

Server runs on `http://localhost:3001`

---

## Production Deployment (Render)

The backend auto-deploys from `main` branch via `render.yaml` blueprint.

**Required environment variables on Render:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AWS_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `AWS_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `AWS_S3_BUCKET` | R2 bucket name |
| `AWS_S3_ENDPOINT` | R2 endpoint URL |
| `STORAGE_PUBLIC_URL` | R2 public bucket URL |
| `FRONTEND_URL` | Vercel frontend URL (for CORS) |
| `SMTP_USER` | Gmail address for notifications |
| `SMTP_PASS` | Gmail app password |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/files` | List user's files |
| POST | `/api/upload` | Upload files (multipart) |
| DELETE | `/api/files/:id` | Delete a file |
| GET | `/api/files/:id/download` | Download a file |
| POST | `/api/signup` | Create account |
| POST | `/api/login` | Login |
| GET | `/api/storage` | Storage usage info |
| GET | `/api/directories` | List directories |
| POST | `/api/directories` | Create directory |

---

## Data Migration

To migrate local `db.json` data to MongoDB Atlas:

```bash
npm run migrate-db
```

Requires `MONGODB_URI` to be set in `.env`.
