# Zenith Collab

A real-time collaborative workspace with multiple document types, built with Next.js, Hocuspocus, and MongoDB.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/License-ISC-yellow?style=flat-square)

## Features

- **Real-time Collaboration** - Multiple users can edit documents simultaneously with live cursor tracking
- **Multiple Document Types**:
  - 📝 **Rich Text Editor** - TipTap-powered editor with formatting options
  - 💻 **Code Editor** - Monaco editor with syntax highlighting and multi-language support
  - 🎨 **Canvas/Whiteboard** - Excalidraw-powered collaborative drawing
  - 📊 **Kanban Board** - Drag-and-drop task management
  - 📅 **Calendar** - Event scheduling with email reminders
  - 💰 **Budget Tracker** - Financial planning and tracking
  - 💸 **Expense Tracker** - Track and categorize expenses
  - ⏱️ **Time Tracker** - Log and monitor time spent
  - 🎯 **Goals Tracker** - Set and track personal/team goals
  - 📁 **File Manager** - Organize and manage files
- **Document Sharing** - Share documents with read/write permissions via public links
- **GitHub OAuth** - Secure authentication with GitHub
- **Email Notifications** - Calendar event reminders via email

## Tech Stack

### Client
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Rich Text**: TipTap
- **Code Editor**: Monaco Editor
- **Canvas**: Excalidraw
- **Real-time**: Hocuspocus Provider + Yjs
- **Auth**: NextAuth.js
- **ORM**: Prisma
- **UI Components**: Lucide Icons, Framer Motion

### Server
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Hocuspocus Server
- **Database**: MongoDB Atlas
- **ORM**: Prisma
- **Email**: Nodemailer
- **Scheduler**: node-cron

## Project Structure

```
zenith-collab/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages & API routes
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # Utilities & configurations
│   │   └── types/         # TypeScript definitions
│   └── prisma/            # Prisma schema
├── server/                 # Hocuspocus backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── email.ts       # Email service
│   │   └── scheduler.ts   # Cron job scheduler
│   └── prisma/            # Prisma schema
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- GitHub OAuth App

### 1. Clone the Repository

```bash
git clone https://github.com/Arnav112-l/Zenith-Collab.git
cd Zenith-Collab
```

### 2. Database Setup (MongoDB Atlas)

1. Go to **[MongoDB Atlas](https://cloud.mongodb.com)** and sign up
2. Click **"Build a Database"** → Choose **FREE** tier
3. Create a database user with **Read and write** permissions
4. Add your IP to **Network Access** → **Allow Access from Anywhere**
5. Get your connection string from **Database** → **Connect** → **Drivers**
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/zenith?retryWrites=true&w=majority
   ```

### 3. GitHub OAuth Setup

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)**
2. Click **"New OAuth App"**
3. Fill in:
   ```
   Application name: Zenith
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```
4. Copy **Client ID** and generate a **Client Secret**

### 4. Environment Variables

**Client** (`client/.env`):
```env
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
NEXT_PUBLIC_WS_URL="ws://localhost:1234"
```

**Server** (`server/.env`):
```env
DATABASE_URL="mongodb+srv://..."
PORT=1234
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
```

Generate `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Install Dependencies

```bash
# Install client dependencies
cd client
npm install
npx prisma generate

# Install server dependencies
cd ../server
npm install
npx prisma generate
```

### 6. Run Development Servers

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

Visit **http://localhost:3000**

---


### Update GitHub OAuth URLs

Update your GitHub OAuth App with production URLs:
```
Homepage URL: https://your-app.vercel.app
Callback URL: https://your-app.vercel.app/api/auth/callback/github
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/list` | Get user's documents |
| POST | `/api/documents` | Create new document |
| GET | `/api/documents/[id]` | Get document by ID |
| PUT | `/api/documents/[id]` | Update document |
| DELETE | `/api/documents/[id]` | Delete document |
| POST | `/api/documents/[id]/share` | Update sharing settings |
| POST | `/api/documents/bulk-delete` | Bulk delete documents |
| POST | `/api/execute` | Execute code (sandbox) |

---

## Environment Variables Reference

### Client

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption |
| `NEXTAUTH_URL` | Base URL of the application |
| `GITHUB_ID` | GitHub OAuth Client ID |
| `GITHUB_SECRET` | GitHub OAuth Client Secret |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL |

### Server

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string |
| `PORT` | Server port (default: 1234) |
| `EMAIL_USER` | Email address for notifications |
| `EMAIL_PASS` | Email app password |

---

## Troubleshooting

### WebSocket Connection Failed
- Verify `NEXT_PUBLIC_WS_URL` uses `wss://` for production
- Check server logs on Render

### Authentication Issues
- Verify GitHub OAuth callback URL matches your domain
- Regenerate `NEXTAUTH_SECRET` if needed

### Database Connection Issues
- Check MongoDB Atlas Network Access settings
- Verify connection string format

---

## Author

**Arnav Singh**

- GitHub: [@Arnav112-l](https://github.com/Arnav112-l)
