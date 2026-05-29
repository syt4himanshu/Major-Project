# 🏗️ Deployment Architecture - PDS System

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER CLOUD                             │
│                                                                  │
│  ┌────────────────────┐      ┌──────────────────────┐          │
│  │   Static Site      │      │    Web Service       │          │
│  │  pds-frontend      │◄────►│   pds-backend        │          │
│  │                    │      │                      │          │
│  │  React + Vite      │      │  Node.js + Express   │          │
│  │  Port: 443 (HTTPS) │      │  Port: 5055          │          │
│  │                    │      │                      │          │
│  │  Environment:      │      │  Environment:        │          │
│  │  - VITE_API_BASE   │      │  - NODE_ENV          │          │
│  │                    │      │  - DATABASE_URL      │          │
│  └────────────────────┘      │  - JWT_SECRET        │          │
│           │                  │  - CORS_ORIGINS      │          │
│           │                  │  - TWILIO_*          │          │
│           │                  └──────────┬───────────┘          │
│           │                             │                       │
│           │                             │                       │
│           │                  ┌──────────▼───────────┐          │
│           │                  │   PostgreSQL DB      │          │
│           │                  │   pds-database       │          │
│           │                  │                      │          │
│           │                  │  - Users             │          │
│           │                  │  - Ration Cards      │          │
│           │                  │  - Transactions      │          │
│           │                  │  - Wallets           │          │
│           │                  │  - QR Sessions       │          │
│           │                  └──────────────────────┘          │
│           │                                                     │
└───────────┼─────────────────────────────────────────────────────┘
            │
            │
    ┌───────▼────────┐
    │   End Users    │
    │                │
    │  - Admin       │
    │  - Shopkeeper  │
    │  - Beneficiary │
    └────────────────┘
```

---

## 🔄 Request Flow

### Admin/Shopkeeper Login Flow

```
User Browser
    │
    │ 1. Visit https://pds-frontend.onrender.com
    ▼
┌─────────────────┐
│  Static Site    │
│  (Frontend)     │
│                 │
│  - Serves HTML  │
│  - Serves JS    │
│  - Serves CSS   │
└────────┬────────┘
         │
         │ 2. POST /auth/login
         │    { email, password }
         ▼
┌─────────────────┐
│  Web Service    │
│  (Backend)      │
│                 │
│  - Verify creds │
│  - Generate JWT │
└────────┬────────┘
         │
         │ 3. Query user
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Database)     │
│                 │
│  - users table  │
└────────┬────────┘
         │
         │ 4. Return user data
         ▼
┌─────────────────┐
│  Web Service    │
│  (Backend)      │
│                 │
│  - Sign JWT     │
└────────┬────────┘
         │
         │ 5. Return { token, user }
         ▼
┌─────────────────┐
│  Static Site    │
│  (Frontend)     │
│                 │
│  - Store token  │
│  - Redirect     │
└─────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────────┐
│   Browser    │
│              │
│ localStorage │
│  - pds_token │
└──────┬───────┘
       │
       │ Every API Request
       │ Authorization: Bearer <token>
       ▼
┌──────────────────┐
│   Backend API    │
│                  │
│  Middleware:     │
│  - verifyToken() │
│  - requireRole() │
└──────┬───────────┘
       │
       │ Verify JWT
       ▼
┌──────────────────┐
│   JWT_SECRET     │
│   (Environment)  │
└──────┬───────────┘
       │
       │ Valid?
       ▼
┌──────────────────┐
│  Route Handler   │
│                  │
│  - Process req   │
│  - Return data   │
└──────────────────┘
```

---

## 📱 OTP Flow (Beneficiary)

```
Mobile App
    │
    │ 1. POST /auth/send-otp
    │    { mobile: "+919876543210" }
    ▼
┌─────────────────┐
│  Backend API    │
│                 │
│  - Validate     │
│  - Check user   │
└────────┬────────┘
         │
         │ 2. Query beneficiary
         ▼
┌─────────────────┐
│  PostgreSQL     │
└────────┬────────┘
         │
         │ 3. User exists
         ▼
┌─────────────────┐
│  Backend API    │
│                 │
│  - Call Twilio  │
└────────┬────────┘
         │
         │ 4. Send OTP via SMS
         ▼
┌─────────────────┐
│  Twilio API     │
│  (External)     │
└────────┬────────┘
         │
         │ 5. SMS sent
         ▼
    User Phone
    (Receives OTP)
         │
         │ 6. POST /auth/verify-otp
         │    { mobile, otp: "123456" }
         ▼
┌─────────────────┐
│  Backend API    │
│                 │
│  - Verify OTP   │
└────────┬────────┘
         │
         │ 7. Verify with Twilio
         ▼
┌─────────────────┐
│  Twilio API     │
└────────┬────────┘
         │
         │ 8. OTP valid
         ▼
┌─────────────────┐
│  Backend API    │
│                 │
│  - Generate JWT │
│  - Return token │
└─────────────────┘
```

---

## 🛒 Dispense Flow (QR Code)

```
Beneficiary App                    Shopkeeper Dashboard
    │                                      │
    │ 1. Generate QR                       │
    │ POST /api/beneficiary/qr-session     │
    ▼                                      │
┌─────────────────┐                       │
│  Backend API    │                       │
│                 │                       │
│  - Create       │                       │
│    qr_session   │                       │
└────────┬────────┘                       │
         │                                 │
         │ 2. Return sessionId             │
         ▼                                 │
Beneficiary App                            │
    │                                      │
    │ 3. Display QR Code                   │
    │    (contains sessionId)              │
    │                                      │
    │ ─────────── Scan QR ────────────────►│
    │                                      │
    │                              4. Scan QR
    │                              GET /api/shopkeeper/beneficiary/:id
    │                              ?sessionId=xxx
    │                                      │
    │                                      ▼
    │                              ┌─────────────────┐
    │                              │  Backend API    │
    │                              │                 │
    │                              │  - Verify       │
    │                              │    session      │
    │                              │  - Check wallet │
    │                              └────────┬────────┘
    │                                       │
    │                              5. Return beneficiary
    │                                 & wallet data
    │                                       │
    │                                       ▼
    │                              Shopkeeper Dashboard
    │                                       │
    │                              6. Enter quantities
    │                              POST /api/shopkeeper/dispense
    │                              { sessionId, rice, wheat, sugar }
    │                                       │
    │                                       ▼
    │                              ┌─────────────────┐
    │                              │  Backend API    │
    │                              │                 │
    │                              │  - Verify       │
    │                              │  - Deduct       │
    │                              │  - Record tx    │
    │                              └────────┬────────┘
    │                                       │
    │                              7. Transaction complete
    │                                       │
    │◄─────────── Success ─────────────────┤
    │                                       │
    ▼                                       ▼
Beneficiary App                    Shopkeeper Dashboard
(Updated wallet)                   (Transaction recorded)
```

---

## 🗄️ Database Schema

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │
│ role        │◄────┐
│ email       │     │
│ mobile      │     │
│ password    │     │
└─────────────┘     │
                    │
┌─────────────┐     │
│   areas     │     │
├─────────────┤     │
│ id (PK)     │◄──┐ │
│ name        │   │ │
└─────────────┘   │ │
                  │ │
┌─────────────┐   │ │
│   shops     │   │ │
├─────────────┤   │ │
│ id (PK)     │◄─┐│ │
│ shop_code   │  ││ │
│ shop_name   │  ││ │
│ area_id (FK)├──┘│ │
│ shopkeeper  ├───┘ │
└─────────────┘     │
                    │
┌─────────────┐     │
│ ration_cards│     │
├─────────────┤     │
│ id (PK)     │◄──┐ │
│ card_number │   │ │
│ category    │   │ │
│ shop_id (FK)│   │ │
│ head_user   ├───┘ │
└──────┬──────┘     │
       │            │
       │            │
┌──────▼──────┐     │
│   wallets   │     │
├─────────────┤     │
│ id (PK)     │     │
│ ration_card │     │
│ rice_balance│     │
│ wheat_bal   │     │
│ sugar_bal   │     │
└─────────────┘     │
                    │
┌─────────────┐     │
│family_members│    │
├─────────────┤     │
│ id (PK)     │     │
│ ration_card │     │
│ user_id (FK)├────┘
│ name        │
│ age         │
│ is_head     │
└─────────────┘

┌─────────────┐
│transactions │
├─────────────┤
│ id (PK)     │
│ ration_card │
│ shop_id     │
│ dispensed_by│
│ rice_qty_kg │
│ wheat_qty_kg│
│ sugar_qty_kg│
│ blockchain  │
└─────────────┘

┌─────────────┐
│ qr_sessions │
├─────────────┤
│ session_id  │
│ ration_card │
│ shop_id     │
│ issued_to   │
│ expires_at  │
│ is_used     │
└─────────────┘
```

---

## 🌐 Network Architecture

```
Internet
    │
    │ HTTPS (443)
    ▼
┌─────────────────────────────────┐
│      Render Load Balancer       │
│                                  │
│  - SSL Termination              │
│  - DDoS Protection              │
│  - Geographic Routing           │
└────────┬────────────────────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
         ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Frontend  │  │  Backend   │  │ Database   │
│  (Static)  │  │  (Node.js) │  │ (Postgres) │
│            │  │            │  │            │
│  Oregon    │  │  Oregon    │  │  Oregon    │
│  Region    │  │  Region    │  │  Region    │
└────────────┘  └────────────┘  └────────────┘
```

---

## 🔒 Security Layers

```
┌─────────────────────────────────────────┐
│         Layer 7: Application            │
│  - JWT Authentication                   │
│  - Role-based Access Control            │
│  - Input Validation (Joi)               │
│  - Rate Limiting                        │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Layer 6: Transport              │
│  - HTTPS/TLS 1.3                        │
│  - SSL Certificate (Auto-renewed)       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Layer 5: Network                │
│  - CORS Policy                          │
│  - Helmet Security Headers              │
│  - DDoS Protection                      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Layer 4: Database               │
│  - SSL Connection                       │
│  - Encrypted at Rest                    │
│  - Access Control                       │
└─────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Read Operation (Get Wallet)

```
Browser → Frontend → Backend → Database → Backend → Frontend → Browser
  │         │          │          │          │          │         │
  │         │          │          │          │          │         │
  1. Click  2. GET    3. Verify  4. SELECT  5. Format  6. JSON   7. Display
     Wallet    /api/     JWT       wallet     data       response    data
               benefi-             FROM                  {wallet}
               ciary/              wallets
               wallet
```

### Write Operation (Dispense)

```
Browser → Frontend → Backend → Database → Database → Backend → Frontend → Browser
  │         │          │          │          │          │          │         │
  │         │          │          │          │          │          │         │
  1. Submit 2. POST   3. Verify  4. BEGIN   5. UPDATE  6. Commit  7. JSON   8. Show
     Form      /api/     JWT       TRANS-     wallet     TRANS-     response   success
               shop-               ACTION     balance    ACTION     {tx}
               keeper/                        INSERT
               dispense                       tx
```

---

## 🔄 Deployment Pipeline

```
Developer
    │
    │ 1. git push origin main
    ▼
┌─────────────────┐
│     GitHub      │
│   Repository    │
└────────┬────────┘
         │
         │ 2. Webhook trigger
         ▼
┌─────────────────┐
│  Render Build   │
│   Environment   │
│                 │
│  - npm install  │
│  - npm run      │
│    migrate:up   │
│  - npm run      │
│    build        │
└────────┬────────┘
         │
         │ 3. Build success
         ▼
┌─────────────────┐
│  Render Deploy  │
│   Environment   │
│                 │
│  - Health check │
│  - Start server │
│  - Route traffic│
└────────┬────────┘
         │
         │ 4. Deployment complete
         ▼
┌─────────────────┐
│   Production    │
│   Environment   │
│                 │
│  - Live traffic │
│  - Monitoring   │
└─────────────────┘
```

---

## 📈 Scaling Architecture

### Current (Free Tier)

```
┌──────────────────────────────────────┐
│  Single Instance                     │
│                                      │
│  Frontend: 1 instance (static)       │
│  Backend:  1 instance (sleeps)       │
│  Database: 1 instance (1GB)          │
│                                      │
│  Handles: ~100 concurrent users      │
└──────────────────────────────────────┘
```

### Scaled (Production)

```
┌──────────────────────────────────────┐
│  Load Balanced                       │
│                                      │
│  Frontend: CDN (global)              │
│  Backend:  2+ instances (always on)  │
│  Database: 1 instance (10GB+)        │
│                                      │
│  Handles: 1000+ concurrent users     │
└──────────────────────────────────────┘
```

---

## 🔍 Monitoring Points

```
┌─────────────────┐
│   Frontend      │
│                 │
│  Monitor:       │
│  - Build time   │
│  - Bundle size  │
│  - Load time    │
│  - Error rate   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │
│                 │
│  Monitor:       │
│  - Response time│
│  - Error rate   │
│  - Memory usage │
│  - CPU usage    │
│  - Request rate │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│                 │
│  Monitor:       │
│  - Query time   │
│  - Connections  │
│  - Storage      │
│  - Replication  │
└─────────────────┘
```

---

## 🎯 Key Metrics

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Frontend Load Time | < 2s | ~1s |
| API Response Time | < 500ms | ~200ms |
| Database Query Time | < 100ms | ~50ms |
| Uptime | > 99.5% | TBD |
| Error Rate | < 1% | TBD |

---

## 🔐 Environment Isolation

```
┌─────────────────────────────────────────────┐
│              Development                     │
│                                              │
│  - Local PostgreSQL                          │
│  - localhost:5174 (frontend)                 │
│  - localhost:5001 (backend)                  │
│  - Weak secrets OK                           │
│  - CORS: Allow all                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              Production                      │
│                                              │
│  - Render PostgreSQL (SSL)                   │
│  - pds-frontend.onrender.com                 │
│  - pds-backend.onrender.com                  │
│  - Strong secrets required                   │
│  - CORS: Specific origins only               │
└─────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-05-29  
**Status**: Production Ready ✅
