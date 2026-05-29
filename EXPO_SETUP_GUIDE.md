# Expo Go Setup Guide for WiFi Network

## Current Configuration

- **WiFi IP Address**: `172.18.241.180`
- **Backend Port**: `5001`
- **API Base URL**: `http://172.18.241.180:5001`

## ✅ Configuration Complete

All necessary files have been configured:

### 1. Backend Configuration (`pds-backend/.env`)
```env
PORT=5001
HOST=0.0.0.0
```

### 2. React Native App Configuration (`pds-beneficiary/.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://172.18.241.180:5001
```

### 3. Server Configuration
- Server now listens on `0.0.0.0` (all network interfaces)
- CORS configured to allow private network IPs (172.x.x.x)
- Android app has `usesCleartextTraffic: true` for HTTP connections

## 🚀 How to Run

### Step 1: Start the Backend Server
```bash
cd pds-backend
npm start
```

**Expected output:**
```
Server running on 0.0.0.0:5001
Network access: http://172.18.241.180:5001
```

### Step 2: Verify Backend is Accessible
Open a new terminal and test:
```bash
curl http://172.18.241.180:5001/api/admin/test
```

Or from your phone's browser, visit:
```
http://172.18.241.180:5001/api/admin/test
```

### Step 3: Start Expo Development Server
```bash
cd pds-beneficiary
npx expo start
```

### Step 4: Connect with Expo Go
1. Install **Expo Go** app on your phone from:
   - iOS: App Store
   - Android: Google Play Store

2. Make sure your phone is connected to the **same WiFi network** (172.18.241.x)

3. Scan the QR code from the terminal using:
   - iOS: Camera app
   - Android: Expo Go app

## 🔍 Troubleshooting

### Issue: "Network request failed" in Expo Go

**Solution 1: Check Backend is Running**
```bash
curl http://172.18.241.180:5001/api/admin/test
```

**Solution 2: Check Firewall**
```bash
# macOS - Allow incoming connections on port 5001
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp node
```

**Solution 3: Verify IP Address**
```bash
# Get your current WiFi IP
ipconfig getifaddr en0
```

If the IP changed, update both:
- `pds-backend/.env` → `HOST=0.0.0.0` (keep this)
- `pds-beneficiary/.env` → `EXPO_PUBLIC_API_BASE_URL=http://NEW_IP:5001`

### Issue: "Unable to connect to Expo"

**Solution:**
- Ensure phone and computer are on the same WiFi
- Try using tunnel mode: `npx expo start --tunnel`
- Restart Expo dev server: Press `r` in terminal

### Issue: Backend not accessible from phone

**Check 1: Server is listening on all interfaces**
```bash
lsof -i :5001
```

**Check 2: Test from another device**
```bash
# From your phone's browser
http://172.18.241.180:5001/api/admin/test
```

**Check 3: Disable VPN** (if using one)

## 📱 Testing the App

### Test Authentication
1. Open the app in Expo Go
2. Try to login with test credentials
3. Check terminal logs for API requests

### Test API Connection
The app should be able to:
- Login/Register
- Fetch beneficiary data
- Generate QR codes
- View entitlements

## 🔧 Quick Commands

### Restart Everything
```bash
# Terminal 1: Backend
cd pds-backend && npm start

# Terminal 2: Expo
cd pds-beneficiary && npx expo start --clear
```

### Check Current IP
```bash
ipconfig getifaddr en0
```

### Test Backend Health
```bash
curl http://172.18.241.180:5001/api/admin/test
```

### View Backend Logs
```bash
tail -f pds-backend/logs/combined.log
```

## 📝 Notes

- **HTTP vs HTTPS**: Using HTTP for local development (configured in Android manifest)
- **Port 5001**: Changed from 5055 to match your configuration
- **CORS**: Already configured to allow all private network IPs in development
- **No Origin Header**: React Native requests don't send Origin header (already handled)

## 🎯 Success Checklist

- [ ] Backend starts on port 5001
- [ ] Backend accessible from `http://172.18.241.180:5001`
- [ ] Expo dev server running
- [ ] Phone connected to same WiFi (172.18.241.x network)
- [ ] Expo Go app installed on phone
- [ ] QR code scanned and app loaded
- [ ] API requests working (check terminal logs)

## 🆘 Still Having Issues?

1. **Restart your computer** (to clear any port conflicts)
2. **Restart your phone** (to clear network cache)
3. **Use Expo Tunnel**: `npx expo start --tunnel` (slower but more reliable)
4. **Check logs**: Look at both Expo terminal and backend logs for errors
