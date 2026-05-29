# ⚡ Quick Start Deployment Guide

**Time Required**: 30-45 minutes

This is a condensed version of the full deployment guide. For detailed instructions, see `RENDER_DEPLOYMENT_GUIDE.md`.

---

## 🚀 5-Step Deployment

### Step 1: Generate JWT Secret (2 minutes)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - you'll need it later.

---

### Step 2: Create Database (5 minutes)

1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Settings:
   - Name: `pds-database`
   - Region: Oregon
   - Plan: Free
3. Click **Create Database**
4. Copy **Internal Database URL**

---

### Step 3: Deploy Backend (10 minutes)

1. Render Dashboard → **New** → **Web Service**
2. Connect GitHub repo
3. Settings:
   - Name: `pds-backend`
   - Root Directory: `pds-backend`
   - Build: `npm install && npm run migrate:up`
   - Start: `npm start`
   - Plan: Free

4. **Environment Variables** (click Advanced):

```bash
NODE_ENV=production
PORT=5055
HOST=0.0.0.0
DATABASE_URL=<paste-from-step-2>
CORS_ORIGINS=https://pds-frontend.onrender.com
CORS_ALLOW_ALL_DEV_ORIGINS=false
JWT_SECRET=<paste-from-step-1>
JWT_EXPIRES_IN=7d
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_SERVICE_SID=<your-twilio-service>
```

5. Click **Create Web Service**
6. Wait for deployment (5-10 min)
7. Copy backend URL

---

### Step 4: Deploy Frontend (10 minutes)

1. Render Dashboard → **New** → **Static Site**
2. Connect GitHub repo
3. Settings:
   - Name: `pds-frontend`
   - Root Directory: `pds-frontend`
   - Build: `npm install && npm run build`
   - Publish: `dist`
   - Plan: Free

4. **Environment Variables**:

```bash
VITE_API_BASE_URL=<paste-backend-url-from-step-3>
```

5. Click **Create Static Site**
6. Wait for deployment (3-5 min)
7. Copy frontend URL

---

### Step 5: Update CORS (5 minutes)

1. Go to backend service
2. Environment tab
3. Update `CORS_ORIGINS` with frontend URL from Step 4
4. Save (auto-redeploys)

---

## ✅ Verify Deployment

1. Open frontend URL
2. Login: `admin@pds.gov` / `admin123`
3. Should see admin dashboard

**Done!** 🎉

---

## 🐛 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend shows "Network Error" | Check `VITE_API_BASE_URL` in frontend env |
| CORS error | Update `CORS_ORIGINS` in backend with exact frontend URL |
| Database error | Verify `DATABASE_URL` includes `?sslmode=require` |
| JWT error | Verify `JWT_SECRET` is set in backend |
| 404 on refresh | Verify `_redirects` file exists in `pds-frontend/public/` |

---

## 📚 Full Documentation

- **Detailed Guide**: `RENDER_DEPLOYMENT_GUIDE.md`
- **Environment Variables**: `PRODUCTION_ENV_TEMPLATE.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Issues Report**: `DEPLOYMENT_REPORT.md`

---

## 🆘 Need Help?

1. Check logs in Render dashboard
2. See `RENDER_DEPLOYMENT_GUIDE.md` troubleshooting section
3. Contact: [Render Community](https://community.render.com)

---

**Quick Start Version**: 1.0
