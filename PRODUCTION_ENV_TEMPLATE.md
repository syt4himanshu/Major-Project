# 🔐 Production Environment Variables Template

## 📝 Instructions

1. **DO NOT** commit these values to Git
2. Set these in Render Dashboard → Service → Environment
3. Generate strong secrets for production
4. Update URLs after deployment

---

## 🎨 Frontend Environment Variables

**Service**: pds-frontend (Static Site)

```bash
# Backend API URL
# Update this with your actual backend URL after deployment
VITE_API_BASE_URL=https://pds-backend.onrender.com
```

**Note**: Replace `pds-backend` with your actual Render service name

---

## 🔧 Backend Environment Variables

**Service**: pds-backend (Web Service)

```bash
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=5055
HOST=0.0.0.0

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Option 1: Render PostgreSQL (Recommended)
# Get this from: Render Dashboard → pds-database → Internal Database URL
DATABASE_URL=postgresql://pds_user:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/pds_production

# Option 2: Neon PostgreSQL
# DATABASE_URL=postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/pds_production?sslmode=require

# ============================================
# CORS CONFIGURATION
# ============================================
# Update this with your actual frontend URL after deployment
CORS_ORIGINS=https://pds-frontend.onrender.com

# IMPORTANT: Set to false in production
CORS_ALLOW_ALL_DEV_ORIGINS=false

# ============================================
# JWT CONFIGURATION
# ============================================
# Generate a strong secret using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=REPLACE_WITH_STRONG_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=7d

# ============================================
# TWILIO CONFIGURATION (OTP Service)
# ============================================
# Get these from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔑 How to Generate Secrets

### JWT Secret (Required)

```bash
# Run this command to generate a strong JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example Output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

Copy this value and use it as `JWT_SECRET`

---

## 🔗 How to Get Database URL

### Render PostgreSQL

1. Go to Render Dashboard
2. Click on your PostgreSQL database (`pds-database`)
3. Copy **Internal Database URL** (starts with `postgresql://`)
4. Use this as `DATABASE_URL`

**Format:**
```
postgresql://pds_user:PASSWORD@dpg-xxxxx.oregon-postgres.render.com/pds_production
```

### Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech)
2. Create project: `pds-production`
3. Copy connection string
4. Add `?sslmode=require` at the end

**Format:**
```
postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/pds_production?sslmode=require
```

---

## 📱 How to Get Twilio Credentials

1. Go to [console.twilio.com](https://console.twilio.com/)
2. Sign up or login
3. Get credentials:

   **Account SID & Auth Token:**
   - Dashboard → Account Info
   - Copy **Account SID** (starts with `AC`)
   - Copy **Auth Token** (click to reveal)

   **Verify Service SID:**
   - Go to **Verify** → **Services**
   - Create new service: "PDS OTP Service"
   - Copy **Service SID** (starts with `VA`)

---

## ✅ Verification Checklist

Before deploying, verify:

### Frontend
- [ ] `VITE_API_BASE_URL` points to correct backend URL
- [ ] URL uses HTTPS (not HTTP)
- [ ] No trailing slash in URL

### Backend
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` includes SSL parameter
- [ ] `CORS_ORIGINS` matches exact frontend URL
- [ ] `CORS_ALLOW_ALL_DEV_ORIGINS=false`
- [ ] `JWT_SECRET` is strong (32+ characters)
- [ ] `JWT_SECRET` is different from development
- [ ] All Twilio credentials are set
- [ ] Twilio credentials are from production account

---

## 🔒 Security Best Practices

1. **Never commit .env files to Git**
   ```bash
   # Verify .env is in .gitignore
   cat .gitignore | grep .env
   ```

2. **Use different secrets for dev and production**
   - Development: Can use simple secrets
   - Production: Must use strong, random secrets

3. **Rotate secrets regularly**
   - JWT_SECRET: Every 3-6 months
   - Twilio: If compromised
   - Database: If compromised

4. **Limit CORS origins**
   - Only include your actual frontend URL
   - Never use wildcards (*) in production

5. **Use SSL for database**
   - Always include `?sslmode=require` for external databases
   - Render internal connections use SSL by default

---

## 📋 Quick Copy Template

### For Render Dashboard

**Frontend (pds-frontend):**
```
VITE_API_BASE_URL=https://YOUR-BACKEND-NAME.onrender.com
```

**Backend (pds-backend):**
```
NODE_ENV=production
PORT=5055
HOST=0.0.0.0
DATABASE_URL=YOUR_DATABASE_URL_HERE
CORS_ORIGINS=https://YOUR-FRONTEND-NAME.onrender.com
CORS_ALLOW_ALL_DEV_ORIGINS=false
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
JWT_EXPIRES_IN=7d
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
TWILIO_SERVICE_SID=YOUR_SERVICE_SID
```

---

## 🆘 Common Issues

### Issue: Frontend can't connect to backend

**Check:**
- `VITE_API_BASE_URL` is correct
- Backend is running (visit URL in browser)
- CORS is configured correctly

### Issue: Database connection failed

**Check:**
- `DATABASE_URL` is correct
- Database is running
- SSL is enabled (`?sslmode=require`)

### Issue: JWT errors

**Check:**
- `JWT_SECRET` is set
- `JWT_SECRET` is same across all backend instances
- Token hasn't expired

### Issue: Twilio OTP not working

**Check:**
- All three Twilio variables are set
- Credentials are from production account
- Phone number format is correct (+91xxxxxxxxxx)

---

**Last Updated**: 2026-05-29
