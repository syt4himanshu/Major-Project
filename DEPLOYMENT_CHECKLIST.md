# ✅ Deployment Checklist - PDS System

## 📦 Pre-Deployment Preparation

### Code Preparation
- [x] Remove hardcoded localhost URLs from frontend
- [x] Add SSL configuration for PostgreSQL
- [x] Remove hardcoded network IPs from logs
- [x] Create database migration for missing columns
- [x] Add SPA fallback routing (_redirects file)
- [x] Update environment variable examples
- [x] Optimize Vite build configuration
- [ ] Run `npm run build` in frontend (verify no errors)
- [ ] Run `npm install` in backend (verify no errors)
- [ ] Test migrations locally

### Security Preparation
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Verify .env files are in .gitignore
- [ ] Remove any committed secrets from Git history
- [ ] Prepare Twilio production credentials
- [ ] Document default admin password change procedure

### Documentation
- [x] Create deployment guide
- [x] Create environment variables template
- [x] Create render.yaml configuration
- [x] Create deployment report
- [x] Create this checklist

---

## 🗄️ Database Setup

### PostgreSQL Creation
- [ ] Create Render PostgreSQL database OR Neon database
- [ ] Name: `pds-database` or `pds-production`
- [ ] Region: Oregon (or closest to you)
- [ ] Plan: Free (or Starter for production)
- [ ] Copy Internal Database URL
- [ ] Verify database is running

### Database Configuration
- [ ] Ensure connection string includes SSL (`?sslmode=require`)
- [ ] Test connection from local machine (optional)
- [ ] Document database credentials securely

---

## 🔧 Backend Deployment

### Service Creation
- [ ] Create new Web Service in Render
- [ ] Connect GitHub repository
- [ ] Set name: `pds-backend`
- [ ] Set region: Same as database
- [ ] Set root directory: `pds-backend`
- [ ] Set build command: `npm install && npm run migrate:up`
- [ ] Set start command: `npm start`
- [ ] Select plan: Free (or Starter)

### Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=5055`
- [ ] Set `HOST=0.0.0.0`
- [ ] Set `DATABASE_URL` (from database)
- [ ] Set `CORS_ORIGINS` (will update after frontend)
- [ ] Set `CORS_ALLOW_ALL_DEV_ORIGINS=false`
- [ ] Set `JWT_SECRET` (generated strong secret)
- [ ] Set `JWT_EXPIRES_IN=7d`
- [ ] Set `TWILIO_ACCOUNT_SID`
- [ ] Set `TWILIO_AUTH_TOKEN`
- [ ] Set `TWILIO_SERVICE_SID`

### Deployment
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check logs for errors
- [ ] Copy backend URL (e.g., `https://pds-backend.onrender.com`)

### Verification
- [ ] Backend is running (green status)
- [ ] No errors in logs
- [ ] Test health endpoint: `curl https://YOUR-BACKEND.onrender.com/api/admin/test`
- [ ] Expected response: `{"error": "No token provided"}`

---

## 🎨 Frontend Deployment

### Service Creation
- [ ] Create new Static Site in Render
- [ ] Connect GitHub repository
- [ ] Set name: `pds-frontend`
- [ ] Set region: Same as backend
- [ ] Set root directory: `pds-frontend`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Select plan: Free

### Environment Variables
- [ ] Set `VITE_API_BASE_URL` (backend URL from previous step)
- [ ] Verify URL uses HTTPS
- [ ] Verify no trailing slash

### Deployment
- [ ] Click "Create Static Site"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check logs for errors
- [ ] Copy frontend URL (e.g., `https://pds-frontend.onrender.com`)

### Verification
- [ ] Frontend is accessible
- [ ] Login page loads correctly
- [ ] No console errors in browser
- [ ] Assets load correctly (images, CSS)

---

## 🔄 CORS Update

### Update Backend CORS
- [ ] Go to backend service in Render
- [ ] Go to Environment tab
- [ ] Update `CORS_ORIGINS` with exact frontend URL
- [ ] Example: `CORS_ORIGINS=https://pds-frontend.onrender.com`
- [ ] Save changes
- [ ] Wait for automatic redeploy (2-3 minutes)
- [ ] Verify backend restarted successfully

---

## 🗃️ Database Migrations

### Run Migrations
- [ ] Migrations should run automatically during backend deployment
- [ ] Check backend logs for migration success
- [ ] If needed, run manually in Shell: `npm run migrate:up`

### Verify Schema
- [ ] Connect to database (optional)
- [ ] Verify tables exist:
  - [ ] users
  - [ ] areas
  - [ ] shops
  - [ ] ration_cards
  - [ ] family_members
  - [ ] wallets
  - [ ] transactions
  - [ ] qr_sessions
  - [ ] policies
  - [ ] otp_verifications

---

## 👤 Admin User Setup

### Create Admin
- [ ] Option A: Run seed script in backend Shell: `npm run seed:admin`
- [ ] Option B: Insert manually via SQL
- [ ] Verify admin user exists in database

### Test Admin Login
- [ ] Go to frontend URL
- [ ] Login with: `admin@pds.gov` / `admin123`
- [ ] Verify successful login
- [ ] Verify redirect to admin dashboard

---

## 🧪 Functional Testing

### Authentication Testing
- [ ] Admin login works
- [ ] Admin logout works
- [ ] Invalid credentials show error
- [ ] Token expiration works
- [ ] Unauthorized access redirects to login

### Admin Dashboard Testing
- [ ] Dashboard loads and shows stats
- [ ] Ration Cards page works
- [ ] Add Ration Card form works
- [ ] Beneficiaries page works
- [ ] Users page works
- [ ] Areas page works
- [ ] Shops page works
- [ ] Entitlements page works
- [ ] Validation page works

### Shopkeeper Testing
- [ ] Create shopkeeper user in admin panel
- [ ] Assign shopkeeper to a shop
- [ ] Logout and login as shopkeeper
- [ ] Shopkeeper dashboard loads
- [ ] Scan and Dispense page works
- [ ] QR code scanning works (if camera available)

### API Testing
- [ ] Test login endpoint
- [ ] Test protected endpoints
- [ ] Test CORS (from frontend)
- [ ] Test rate limiting
- [ ] Test error handling

### OTP Testing (Optional)
- [ ] Test OTP send endpoint
- [ ] Verify SMS received (if Twilio configured)
- [ ] Test OTP verification
- [ ] Test invalid OTP handling

---

## 🔒 Security Hardening

### Password Security
- [ ] Change default admin password
- [ ] Document new password securely
- [ ] Verify password complexity requirements

### Environment Security
- [ ] Verify JWT_SECRET is strong
- [ ] Verify JWT_SECRET is different from development
- [ ] Verify no secrets in logs
- [ ] Verify CORS only allows frontend URL
- [ ] Verify SSL is enabled for database

### Access Control
- [ ] Test role-based access control
- [ ] Verify admin can't access shopkeeper routes
- [ ] Verify shopkeeper can't access admin routes
- [ ] Verify beneficiary can't access admin/shopkeeper routes

---

## 📊 Monitoring Setup

### Backend Monitoring
- [ ] Check backend logs for errors
- [ ] Monitor response times
- [ ] Check memory usage
- [ ] Check CPU usage
- [ ] Set up log alerts (optional)

### Frontend Monitoring
- [ ] Check frontend logs
- [ ] Monitor build times
- [ ] Check bandwidth usage
- [ ] Test from different browsers

### Database Monitoring
- [ ] Check connection count
- [ ] Monitor storage usage
- [ ] Check query performance
- [ ] Set up backup schedule (optional)

---

## 🔄 Auto-Deploy Setup (Optional)

### Enable Auto-Deploy
- [ ] Go to backend service → Settings
- [ ] Enable "Auto-Deploy"
- [ ] Select branch: `main`
- [ ] Go to frontend service → Settings
- [ ] Enable "Auto-Deploy"
- [ ] Select branch: `main`

### Test Auto-Deploy
- [ ] Make a small change to code
- [ ] Push to GitHub
- [ ] Verify automatic deployment
- [ ] Verify changes are live

---

## 📱 Mobile Testing

### Responsive Design
- [ ] Test on mobile browser (iPhone)
- [ ] Test on mobile browser (Android)
- [ ] Test on tablet
- [ ] Test different screen sizes
- [ ] Verify QR scanner works on mobile

---

## 📝 Documentation

### Update Documentation
- [ ] Document production URLs
- [ ] Document admin credentials (securely)
- [ ] Document deployment process
- [ ] Document troubleshooting steps
- [ ] Document backup procedures

### Share with Team
- [ ] Share deployment guide
- [ ] Share environment variables template
- [ ] Share admin credentials (securely)
- [ ] Share monitoring dashboard access

---

## 🐛 Troubleshooting Verification

### Common Issues Tested
- [ ] Frontend "Network Error" - CORS working
- [ ] Database connection - SSL working
- [ ] JWT errors - Secret configured
- [ ] Twilio errors - Credentials working
- [ ] 404 on refresh - SPA routing working
- [ ] Build errors - Dependencies installed

---

## 🎉 Go-Live Checklist

### Final Verification
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Security hardened
- [ ] Documentation complete
- [ ] Team trained
- [ ] Backup plan ready
- [ ] Rollback plan ready

### Announcement
- [ ] Notify stakeholders
- [ ] Share production URLs
- [ ] Share user guide
- [ ] Schedule training session
- [ ] Set up support channel

---

## 📈 Post-Deployment

### Week 1
- [ ] Monitor logs daily
- [ ] Check error rates
- [ ] Gather user feedback
- [ ] Fix critical issues
- [ ] Document lessons learned

### Month 1
- [ ] Review performance metrics
- [ ] Optimize slow queries
- [ ] Update documentation
- [ ] Plan feature updates
- [ ] Review security

### Ongoing
- [ ] Regular security updates
- [ ] Dependency updates
- [ ] Performance monitoring
- [ ] User feedback incorporation
- [ ] Feature enhancements

---

## 🆘 Emergency Contacts

### Services
- **Render Support**: [community.render.com](https://community.render.com)
- **Twilio Support**: [console.twilio.com](https://console.twilio.com)
- **GitHub Support**: [support.github.com](https://support.github.com)

### Team Contacts
- **Developer**: [Your contact]
- **DevOps**: [Your contact]
- **Admin**: [Your contact]

---

## 📊 Deployment Status

**Status**: ⏳ In Progress

**Started**: ___________
**Completed**: ___________
**Deployed By**: ___________

**Production URLs**:
- Frontend: ___________
- Backend: ___________
- Database: ___________

**Notes**:
___________________________________________
___________________________________________
___________________________________________

---

**Checklist Version**: 1.0
**Last Updated**: 2026-05-29
