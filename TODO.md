# Project Fix Todo

## Backend Fixes
- [x] Fix JWT_SECRET mismatch in `backend/src/controllers/authController.js` (load dotenv before reading secret)
- [x] Add missing `GET /api/admin/videos` route (was 404) + `getAllVideos` controller

## Frontend Fixes
- [x] Fix withdrawal endpoint path in `frontend/src/pages/Withdrawals.jsx` (`/withdrawals` → `/payments/withdrawals`)
- [x] Fix withdrawal & transaction endpoint paths in `frontend/src/pages/Dashboard.jsx`
- [x] Fix AdminWithdrawals PATCH → PUT in `frontend/src/pages/AdminWithdrawals.jsx`
- [x] Frontend builds cleanly (112 modules, no errors)

## Verification
- [x] Backend running on port 5000
- [x] MySQL running (XAMPP, port 3306)
- [x] Admin login works (admin@videorewards.rw / admin123)
- [x] All API endpoints return 200 (stats, videos, withdrawals, transactions, payments)
- [x] Frontend dev server running on port 3000 with API proxy
