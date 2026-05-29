# 🚀 Render Deployment Guide - PDS System

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Twilio Account**: Get credentials from [console.twilio.com](https://console.twilio.com/)
4. **Strong JWT Secret**: Generate using:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## 🗄️ Step 1: Create PostgreSQL Database

### Option A: Render PostgreSQL (Recommended)

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `pds-database`
   - **Database**: `pds_production`
   - **User**: `pds_user`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free
3. Click **Create Database**
4. Wait for provisioning (2-3 minutes)
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Option B: Neon PostgreSQL (Alternative)

1. Go to [neon.tech](https://neon.tech) and create account
2. Create new project: `pds-production`
3. Copy connection string with `?sslmode=require`

---

## 🔧 Step 2: Deploy Backend API

### 2.1 Create Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name**: `pds-backend`
   - **Region**: Oregon (same as database)
   - **Branch**: `main`
   - **Root Directory**: `pds-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run migrate:up`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 2.2 Set Environment Variables

Click **Advanced** → **Add Environment Variable** and add:

```bash
# Server Configuration
NODE_ENV=production
PORT=5055
HOST=0.0.0.0

# Database (use Internal Database URL from Step 1)
DATABASE_URL=postgresql://pds_user:password@dpg-xxxxx.oregon-postgres.render.com/pds_production

# CORS (update after frontend deployment)
CORS_ORIGINS=https://pds-frontend.onrender.com
CORS_ALLOW_ALL_DEV_ORIGINS=false

# JWT (generate strong secret)
JWT_SECRET=<paste-your-generated-secret-here>
JWT_EXPIRES_IN=7d

# Twilio (from console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Deploy

1. Click **Create Web Service**
2. Wait for build and deployment (5-10 minutes)
3. Your backend will be available at: `https://pds-backend.onrender.com`

### 2.4 Verify Backend

Test the API:
```bash
curl https://pds-backend.onrender.com/api/admin/test
```

Expected: `{"error": "No token provided"}` (this is correct - auth is working)

---

## 🎨 Step 3: Deploy Frontend

### 3.1 Create Static Site

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name**: `pds-frontend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `pds-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

### 3.2 Set Environment Variables

Click **Advanced** → **Add Environment Variable**:

```bash
VITE_API_BASE_URL=https://pds-backend.onrender.com
```

⚠️ **IMPORTANT**: Replace `pds-backend` with your actual backend service name from Step 2

### 3.3 Deploy

1. Click **Create Static Site**
2. Wait for build and deployment (3-5 minutes)
3. Your frontend will be available at: `https://pds-frontend.onrender.com`

---

## 🔄 Step 4: Update CORS Configuration

Now that you have the frontend URL, update the backend:

1. Go to **pds-backend** service in Render
2. Go to **Environment** tab
3. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://pds-frontend.onrender.com
   ```
4. Click **Save Changes**
5. Backend will automatically redeploy

---

## 🗃️ Step 5: Run Database Migrations

Migrations should run automatically during deployment, but if needed:

1. Go to **pds-backend** service
2. Click **Shell** tab
3. Run:
   ```bash
   npm run migrate:up
   ```

---

## 👤 Step 6: Create Admin User

### Option A: Using Seed Script

1. Go to **pds-backend** service → **Shell**
2. Run:
   ```bash
   npm run seed:admin
   ```

### Option B: Manual SQL

1. Go to your PostgreSQL database in Render
2. Click **Connect** → **External Connection**
3. Use a PostgreSQL client (e.g., pgAdmin, DBeaver) to connect
4. Run:
   ```sql
   INSERT INTO users (role, email, password_hash)
   VALUES ('admin', 'admin@pds.gov', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
   ON CONFLICT (email) DO NOTHING;
   ```

**Default Admin Credentials:**
- Email: `admin@pds.gov`
- Password: `admin123`

⚠️ **SECURITY**: Change this password immediately after first login!

---

## ✅ Step 7: Test the Deployment

### 7.1 Test Frontend Access

1. Open: `https://pds-frontend.onrender.com`
2. You should see the login page
3. Try logging in with admin credentials

### 7.2 Test Admin Dashboard

1. Login as admin
2. Navigate to: `https://pds-frontend.onrender.com/admin/dashboard`
3. Verify all pages load correctly:
   - Dashboard
   - Ration Cards
   - Beneficiaries
   - Users
   - Areas
   - Shops
   - Entitlements
   - Validation

### 7.3 Test Shopkeeper Dashboard

1. Create a shopkeeper user in Admin panel
2. Logout and login as shopkeeper
3. Navigate to: `https://pds-frontend.onrender.com/shopkeeper/dashboard`
4. Test QR scanning functionality

### 7.4 Test API Endpoints

```bash
# Health check
curl https://pds-backend.onrender.com/api/admin/test

# Login
curl -X POST https://pds-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pds.gov","password":"admin123"}'
```

---

## 🔒 Step 8: Security Hardening

### 8.1 Change Default Admin Password

1. Login as admin
2. Go to Users section
3. Update admin password

### 8.2 Verify Environment Variables

Ensure these are NOT exposed:
- ✅ JWT_SECRET is strong (32+ characters)
- ✅ Twilio credentials are correct
- ✅ DATABASE_URL is using SSL
- ✅ CORS_ORIGINS only includes your frontend URL

### 8.3 Enable Auto-Deploy (Optional)

1. Go to each service → **Settings**
2. Enable **Auto-Deploy** for automatic updates on git push

---

## 📊 Step 9: Monitor Your Deployment

### Backend Monitoring

1. Go to **pds-backend** service
2. Check **Logs** tab for errors
3. Monitor **Metrics** for performance

### Frontend Monitoring

1. Go to **pds-frontend** service
2. Check **Logs** for build errors
3. Monitor deploy history

### Database Monitoring

1. Go to **pds-database**
2. Check **Metrics** for:
   - Connection count
   - Storage usage
   - Query performance

---

## 🐛 Troubleshooting

### Issue: Frontend shows "Network Error"

**Solution:**
1. Check `VITE_API_BASE_URL` in frontend environment variables
2. Verify backend is running: `https://pds-backend.onrender.com`
3. Check CORS settings in backend

### Issue: "CORS blocked" error

**Solution:**
1. Verify `CORS_ORIGINS` in backend includes exact frontend URL
2. Ensure `CORS_ALLOW_ALL_DEV_ORIGINS=false` in production
3. Check browser console for exact origin being blocked

### Issue: Database connection failed

**Solution:**
1. Verify `DATABASE_URL` includes `?sslmode=require`
2. Check database is running in Render dashboard
3. Verify database region matches backend region

### Issue: "Invalid token" or JWT errors

**Solution:**
1. Verify `JWT_SECRET` is set in backend
2. Clear browser localStorage and login again
3. Check token expiration settings

### Issue: Twilio OTP not working

**Solution:**
1. Verify all three Twilio environment variables are set
2. Check Twilio console for API errors
3. Verify phone number format (+91xxxxxxxxxx)

### Issue: 404 on page refresh

**Solution:**
1. Verify `_redirects` file exists in `pds-frontend/public/`
2. Content should be: `/*    /index.html   200`
3. Redeploy frontend

### Issue: Migrations not running

**Solution:**
1. Go to backend Shell
2. Run manually: `npm run migrate:up`
3. Check logs for migration errors

---

## 🔄 Updating Your Deployment

### Update Backend

1. Push changes to GitHub
2. Render auto-deploys (if enabled)
3. Or manually: Go to service → **Manual Deploy** → **Deploy latest commit**

### Update Frontend

1. Push changes to GitHub
2. Render auto-deploys (if enabled)
3. Or manually: Go to service → **Manual Deploy** → **Deploy latest commit**

### Run New Migrations

1. Add migration file to `pds-backend/migrations/`
2. Push to GitHub
3. Backend will run migrations automatically on deploy
4. Or manually in Shell: `npm run migrate:up`

---

## 💰 Cost Estimate

### Free Tier Limits (Render)

- **PostgreSQL**: 1 GB storage, 97 hours/month compute
- **Web Service**: 750 hours/month (sleeps after 15 min inactivity)
- **Static Site**: 100 GB bandwidth/month

### Upgrade Recommendations

For production use, consider:
- **Backend**: Starter ($7/month) - No sleep, better performance
- **Database**: Starter ($7/month) - 10 GB storage, always on
- **Frontend**: Free tier is sufficient

**Total Production Cost**: ~$14/month

---

## 📞 Support

### Render Support
- Docs: [render.com/docs](https://render.com/docs)
- Community: [community.render.com](https://community.render.com)

### Twilio Support
- Docs: [twilio.com/docs](https://www.twilio.com/docs)
- Console: [console.twilio.com](https://console.twilio.com)

---

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Admin login tested
- [ ] Shopkeeper login tested
- [ ] Default password changed
- [ ] Twilio OTP tested
- [ ] All dashboard pages working
- [ ] QR code generation tested
- [ ] Transaction flow tested
- [ ] Monitoring enabled

---

**Deployment Complete! 🎉**

Your PDS system is now live and ready for production use.

**URLs:**
- Frontend: `https://pds-frontend.onrender.com`
- Backend: `https://pds-backend.onrender.com`
- Admin: `https://pds-frontend.onrender.com/admin/dashboard`
- Shopkeeper: `https://pds-frontend.onrender.com/shopkeeper/dashboard`
