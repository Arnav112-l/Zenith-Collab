# Zenith Deployment Guide - Vercel + Render

## 🎯 Overview
- **Frontend (Client)**: Vercel
- **Backend (Server)**: Render
- **Database**: Neon PostgreSQL (Free)
- **Auth**: GitHub OAuth

---

## 📋 Step 1: Database Setup (Neon)

1. Go to **[neon.tech](https://neon.tech)** and sign up
2. Click **"Create Project"**
3. Choose a region close to you
4. Copy both connection strings:
   - **Connection string** → `DATABASE_URL`
   - **Connection string (pooled)** → `DIRECT_URL`
5. Save these for later!

---

## 🔑 Step 2: GitHub OAuth Setup

1. Go to **[GitHub Developer Settings](https://github.com/settings/developers)**
2. Click **"New OAuth App"**
3. Fill in:
   ```
   Application name: Zenith
   Homepage URL: https://your-app-name.vercel.app (we'll update this)
   Authorization callback URL: https://your-app-name.vercel.app/api/auth/callback/github
   ```
4. Click **"Register application"**
5. Copy **Client ID**
6. Click **"Generate a new client secret"** and copy it
7. Keep this tab open - we'll update the URLs after deployment

---

## 🎨 Step 3: Deploy Client to Vercel

### A. Install Vercel CLI
```powershell
npm install -g vercel
```

### B. Deploy Client
```powershell
cd client
vercel login
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **What's your project's name?** → zenith (or your choice)
- **In which directory is your code located?** → ./
- **Want to override settings?** → No

### C. Configure Environment Variables

After deployment, go to **[Vercel Dashboard](https://vercel.com/dashboard)**:

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```env
DATABASE_URL
Value: postgresql://... (from Neon - Connection string)

DIRECT_URL
Value: postgresql://... (from Neon - Pooled connection string)

NEXTAUTH_SECRET
Value: (Generate by running: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

NEXTAUTH_URL
Value: https://your-app-name.vercel.app

GITHUB_ID
Value: (from GitHub OAuth app)

GITHUB_SECRET
Value: (from GitHub OAuth app)

NEXT_PUBLIC_WS_URL
Value: wss://your-server-name.onrender.com (we'll add this after server deployment)
```

### D. Run Database Migrations

```powershell
# Still in client directory
npx prisma generate
npx prisma db push
```

### E. Redeploy
```powershell
vercel --prod
```

---

## 🖥️ Step 4: Deploy Server to Render

### A. Push Code to GitHub (if not already)
```powershell
cd ..
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### B. Create Render Web Service

1. Go to **[render.com](https://render.com)** and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account
4. Select **"Zenith-Collab"** repository
5. Configure:
   ```
   Name: zenith-server (or your choice)
   Region: Choose closest to your Neon database
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

### C. Add Environment Variables

In the **Environment** section, add:

```env
DATABASE_URL
Value: postgresql://... (same as client - from Neon)

DIRECT_URL
Value: postgresql://... (same as client - from Neon)

PORT
Value: 1234

EMAIL_USER
Value: your-email@gmail.com

EMAIL_PASS
Value: your-gmail-app-password (see below for setup)
```

### D. Deploy
Click **"Create Web Service"** - Render will start building and deploying

### E. Copy Server URL
After deployment, copy your server URL: `https://zenith-server.onrender.com`

---

## 🔄 Step 5: Update Client with Server URL

1. Go back to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_WS_URL` and update it:
   ```
   NEXT_PUBLIC_WS_URL
   Value: wss://zenith-server.onrender.com
   ```
3. Go to **Deployments** tab
4. Click **"Redeploy"** on the latest deployment

---

## 📧 Step 6: Setup Gmail for Email Notifications

1. Go to your **[Google Account](https://myaccount.google.com/)**
2. Enable **2-Step Verification** (Security → 2-Step Verification)
3. Go to **App Passwords** (Security → 2-Step Verification → App passwords)
4. Select **"Mail"** and your device
5. Copy the 16-character password
6. Update `EMAIL_PASS` in Render environment variables
7. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🔧 Step 7: Update GitHub OAuth Callback

1. Go back to your **[GitHub OAuth App](https://github.com/settings/developers)**
2. Update URLs:
   ```
   Homepage URL: https://your-app-name.vercel.app
   Authorization callback URL: https://your-app-name.vercel.app/api/auth/callback/github
   ```
3. Click **"Update application"**

---

## ✅ Step 8: Test Your Deployment

1. Visit `https://your-app-name.vercel.app`
2. Click **"Sign in with GitHub"**
3. Create a new document
4. Test real-time collaboration:
   - Open same document in incognito window
   - Type in both windows - should sync in real-time
5. Test calendar email notification:
   - Create calendar document
   - Add event with email reminder
   - Check if email arrives at scheduled time

---

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Check `NEXT_PUBLIC_WS_URL` is correct in Vercel
- Ensure it starts with `wss://` (not `ws://`)
- Check Render server logs for errors

### Authentication Issues
- Verify GitHub OAuth callback URL matches Vercel domain
- Check `NEXTAUTH_URL` matches your Vercel domain
- Regenerate `NEXTAUTH_SECRET` if needed

### Database Connection Issues
- Verify both `DATABASE_URL` and `DIRECT_URL` are set
- Run `npx prisma db push` again if tables are missing
- Check Neon database is in same region as Render

### Email Notifications Not Working
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check Render server logs for email errors
- Test with a different email provider if Gmail fails

---

## 📊 Monitoring

### Vercel
- Dashboard: https://vercel.com/dashboard
- View deployment logs, analytics, and errors

### Render
- Dashboard: https://dashboard.render.com/
- View server logs and metrics
- Free tier sleeps after 15 minutes of inactivity (wakes up on request)

### Database
- Neon Console: https://console.neon.tech/
- Monitor database usage and queries

---

## 💰 Costs

- **Vercel**: Free tier includes 100GB bandwidth
- **Render**: Free tier with limitations (sleeps after inactivity)
- **Neon**: Free tier includes 0.5GB storage
- **GitHub OAuth**: Free
- **Gmail**: Free

---

## 🚀 Optional: Custom Domain

### Vercel
1. Go to project **Settings** → **Domains**
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable
5. Update GitHub OAuth callback URL

### Render
1. Go to **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records
4. Update `NEXT_PUBLIC_WS_URL` in Vercel

---

## 📝 Quick Reference

```env
# Vercel Environment Variables
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
GITHUB_ID=...
GITHUB_SECRET=...
NEXT_PUBLIC_WS_URL=wss://your-server.onrender.com

# Render Environment Variables
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
PORT=1234
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

Need help? Check the logs:
- **Vercel**: Dashboard → Deployments → Click on deployment → Function Logs
- **Render**: Dashboard → Your Service → Logs tab
