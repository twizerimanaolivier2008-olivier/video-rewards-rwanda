# Video Rewards Rwanda

A platform where users can register, watch videos, and earn rewards (points and money). This connects video viewers with advertisers.

## Features

- **User Registration & Authentication** - Secure registration with referral code support
- **Video Watching** - Browse and watch videos across multiple categories
- **Rewards System** - Earn points and money for watching videos to completion
- **User Dashboard** - Track earnings, points balance, and transaction history
- **Withdrawal Requests** - Request withdrawals via MTN MoMo and Airtel Money
- **Referral Program** - Earn bonuses by referring friends (Level 1 & Level 2)
- **Admin Dashboard** - Manage users, videos, withdrawals, and view platform statistics
- **Advertiser Support** - Companies can upload promotional videos

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: MTN Mobile Money & Airtel Money API integration
- **Styling**: Inline CSS (Rwanda green/white theme)

## Project Structure

```
video-rewards-rwanda/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── videoController.js
│   │   │   ├── paymentController.js
│   │   │   ├── referralController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── admin.js
│   │   │   └── upload.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Video.js
│   │   │   ├── VideoView.js
│   │   │   ├── Transaction.js
│   │   │   ├── Withdrawal.js
│   │   │   └── ReferralEarning.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── videos.js
│   │       ├── payments.js
│   │       ├── referrals.js
│   │       ├── users.js
│   │       └── admin.js
│   ├── .env
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Videos.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Referrals.jsx
│   │   │   ├── Withdrawals.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminVideos.jsx
│   │   │   └── AdminWithdrawals.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useVideos.js
│   │   │   └── useReferrals.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── .env
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL Server
- npm or yarn

### 1. Database Setup

```bash
# Import the database schema
mysql -u root -p < database/schema.sql
```

For an existing database, apply `database/migrations/002-add-account-security.sql` once before restarting the backend. Fresh database installations include the account security fields and code table in the schema.

### 2. Backend Setup

```powershell
npm --prefix backend install
Copy-Item backend\.env.example backend\.env
# Edit backend\.env with your database credentials and API keys
npm --prefix backend run dev
```

The backend server will run on `http://localhost:5000`

### 3. Frontend Setup

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Run the backend and frontend commands in separate terminals. The frontend will run on `http://localhost:3000`.

### 4. Create or Promote an Admin Account

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` in the ignored `backend/.env` file, then run this command from the repository root:

```bash
npm --prefix backend run admin:setup
```

The setup command hashes the password and creates the admin account, or promotes an existing account with that email and updates its password. Keep real credentials out of source control. The database must be running and the schema must be imported first.

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: 5000) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret key for JWT tokens |
| `MOMO_API_KEY` | MTN MoMo API key |
| `MOMO_API_SECRET` | MTN MoMo API secret |
| `MOMO_SUBSCRIPTION_KEY` | MTN MoMo subscription key |
| `AIRTEL_API_KEY` | Airtel Money API key |
| `AIRTEL_API_SECRET` | Airtel Money API secret |
| `FRONTEND_URL` | Frontend URL for CORS |

## Payment Integration

The platform supports two mobile money providers:

1. **MTN Mobile Money** - Rwanda's leading mobile money service
2. **Airtel Money** - Airtel's mobile money service

### Registration Fee: 4,750 RWF

New users must pay 4,750 RWF to create a Premium account.

### Referral Earnings

- **Level 1 Referral**: 10% of referee's registration fee (475 RWF + 50 points)
- **Level 2 Referral**: 5% of referee's registration fee

### Withdrawal

- Minimum withdrawal: 2,000 RWF
- Withdrawals are processed to the user's mobile money account

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video
- `POST /api/videos/:id/watch` - Record video watch
- `GET /api/videos/history` - Get watch history

### Payments
- `POST /api/payments/momo/initiate` - Initiate MTN MoMo payment
- `POST /api/payments/momo/verify` - Verify MTN MoMo payment
- `POST /api/payments/airtel/initiate` - Initiate Airtel Money payment
- `POST /api/payments/airtel/verify` - Verify Airtel Money payment
- `POST /api/payments/withdrawals` - Request withdrawal
- `GET /api/payments/withdrawals` - Get withdrawal history
- `GET /api/payments/methods` - Get withdrawal methods

### Referrals
- `GET /api/referrals/stats` - Get referral statistics
- `GET /api/referrals/list` - Get referral list
- `GET /api/referrals/code` - Get referral code
- `POST /api/referrals/generate` - Generate new referral code

### Users
- `GET /api/users/stats` - Get user dashboard stats
- `GET /api/users/balance` - Get user balance
- `GET /api/users/transactions` - Get user transactions

### System
- `GET /api/health` - Check API and database readiness

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/videos` - Create video
- `PUT /api/admin/videos/:id` - Update video
- `DELETE /api/admin/videos/:id` - Delete video
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PUT /api/admin/withdrawals/:id` - Process withdrawal

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- SQL injection prevention using parameterized queries
- Input validation on all endpoints
- CORS configuration for frontend origin

## Future Enhancements

- Email verification
- SMS notifications for withdrawals
- Video upload by advertisers
- Advanced analytics dashboard
- Mobile app (React Native)
- Multi-language support (Kinyarwanda, English, French)

## License

Copyright 2024 Video Rewards Rwanda. All rights reserved.
