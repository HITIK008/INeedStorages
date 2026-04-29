# INeedStorage Backend Server

## Setup & Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

```bash
npm start
```

Server will run on `http://localhost:3000`

### 3. Development Mode (with auto-reload)

```bash
npm run dev
```

---

## Features

✅ **File Upload** - Upload up to 10 files (max 500MB each)  
✅ **File Storage** - Files saved in `/server/uploads` directory  
✅ **Database** - Metadata stored in `/server/db.json`  
✅ **Auto-Expiry** - Files expire after 30 days  
✅ **File Download** - Download uploaded files  
✅ **File Deletion** - Delete files from storage  
✅ **Location Support** - Track file location (Central Europe, Western US, etc.)  
✅ **Notes** - Add notes to files displayed on download link  

---

## API Endpoints

### GET `/api/files`
Fetch all uploaded files

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "file.pdf",
    "size": 1024,
    "type": "application/pdf",
    "uploadedAt": "2026-02-09T10:00:00.000Z",
    "expiresAt": "2026-03-11T10:00:00.000Z",
    "location": "Central Europe",
    "notes": "Important document"
  }
]
```

---

### POST `/api/upload`
Upload files to the server

**Form Data:**
- `files` (file, multiple) - Files to upload
- `notes` (string) - Notes for the file
- `location` (string) - Storage location

**Response:**
```json
{
  "success": true,
  "files": [...]
}
```

---

### DELETE `/api/files/:id`
Delete a file by ID

**Response:**
```json
{
  "success": true,
  "message": "File deleted"
}
```

---

### GET `/api/files/:id/download`
Download a file by ID (redirects to file download)

---

### GET `/api/health`
Check server status

**Response:**
```json
{
  "status": "Server is running",
  "port": 5000
}
```

---

## File Storage

- **Upload Directory**: `/server/uploads`
- **Database File**: `/server/db.json`
- **Max File Size**: 500MB
- **Default Expiry**: 30 days

---

## Running Both Frontend & Backend

**Terminal 1 (Frontend):**
```bash
npm run dev
```
Runs on `http://localhost:5175`

**Terminal 2 (Backend):**
```bash
cd server
npm start
```
Runs on `http://localhost:3000`

---

## Notes
- Files are physically stored in `/server/uploads`
- File metadata persists in `/server/db.json`
- CORS is enabled for frontend access
- Both frontend and backend must be running for full functionality
