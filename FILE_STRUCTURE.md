# File Structure Summary

This document describes every file created for your mental health check-ins website.

## 📂 Project Structure

```
Website/
├── pages/                          # Next.js pages and API routes
│   ├── _app.js                    # App wrapper (configures CSS)
│   ├── index.js                   # Home (redirects to /auth)
│   ├── auth.js                    # Login/signup page
│   ├── dashboard.js               # Check-in dashboard
│   ├── checkin/
│   │   └── [id].js               # Individual check-in page
│   └── api/                        # Backend API routes
│       ├── auth/
│       │   ├── signup.js          # Create account + init check-ins
│       │   ├── login.js           # Authenticate user
│       │   └── logout.js          # End session
│       ├── checkins.js            # Get user's check-ins
│       └── checkin-submit.js      # Submit check-in, unlock next
│
├── lib/                            # Utility functions
│   ├── db.js                      # PostgreSQL connection pool
│   ├── s3.js                      # AWS S3 upload helper
│   └── auth.js                    # Authentication helper
│
├── components/                     # Reusable React components
│   └── Header.js                  # App header with logout
│
├── styles/                         # CSS files
│   └── globals.css                # Tailwind CSS imports
│
├── 📄 Configuration Files
│   ├── package.json               # NPM dependencies
│   ├── .env.local.example         # Environment variables template
│   ├── .gitignore                 # Git ignore patterns
│   ├── next.config.js             # Next.js config
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   └── vercel.json                # Vercel deployment config
│
├── 📚 Documentation
│   ├── README.md                  # Complete documentation
│   ├── QUICK_START.md             # 5-minute setup guide
│   ├── DEPLOYMENT.md              # Vercel deployment guide
│   ├── SETUP_CHECKLIST.md         # Step-by-step checklist
│   ├── API_DOCS.md                # API endpoint reference
│   └── FILE_STRUCTURE.md          # This file
│
└── 🗄️ Database
    └── database_schema.sql         # PostgreSQL tables and indexes
```

## 📄 File Descriptions

### Frontend Pages

#### `pages/index.js`
- Redirects users to `/auth` on page load
- Entry point of the application

#### `pages/auth.js` (Login/Signup)
- Toggle between login and signup modes
- Calls `/api/auth/login` or `/api/auth/signup`
- Beautiful blue/purple gradient UI with Tailwind CSS
- Shows errors if submit fails

#### `pages/dashboard.js` (Check-in List)
- Shows 3 check-ins with progress
- Current check-in highlighted in bold blue
- Shows unlock dates for locked check-ins
- Shows completion dates/checkmarks for completed ones
- Navigates to individual check-in on click
- Logout button in header

#### `pages/checkin/[id].js` (Single Check-in)
- Dynamic page based on check-in ID
- Placeholder for your questions/content
- Submit button that posts to `/api/checkin-submit`
- Success message and redirect to dashboard
- Back button to return to dashboard

### Backend API Routes

#### `pages/api/auth/signup.js`
- Creates new user with hashed password (bcrypt)
- Initializes 3 check-ins:
  - Check-in 1: unlocked immediately
  - Check-in 2: unlocked 3 days later
  - Check-in 3: unlocked 6 days later
- Creates database session
- Returns session cookie

#### `pages/api/auth/login.js`
- Verifies username and password
- Creates database session
- Returns session cookie
- Checks session expiration

#### `pages/api/auth/logout.js`
- Deletes session from database
- Clears session cookie

#### `pages/api/checkins.js`
- Gets all check-ins for authenticated user
- Returns: number, completed status, unlock date
- Checks if each is unlocked (by comparing dates)

#### `pages/api/checkin-submit.js`
- Marks check-in as completed
- Stores data in `checkins_data` table as JSON
- Automatically unlocks next check-in (adds 3 days)
- Validates user owns the check-in

### Utilities

#### `lib/db.js`
- PostgreSQL connection pool using `pg`
- Reused across all database operations
- Automatically manages connections

#### `lib/s3.js`
- Uploads files to AWS S3
- Returns file URL
- Ready for audio recording uploads

#### `lib/auth.js`
- Helper function to get authenticated user from session
- Used internally by API routes

### Components

#### `components/Header.js`
- Reusable header with title and logout button
- Can be imported in any page

### Configuration

#### `package.json`
- All npm dependencies listed
- Scripts: `dev`, `build`, `start`, `lint`
- Includes: react, next, pg, aws-sdk, bcryptjs, uuid, tailwindcss

#### `.env.local.example`
- Template for environment variables
- Copy to `.env.local` and fill in values
- Includes: database credentials, AWS credentials, API URL

#### `next.config.js`
- Next.js configuration
- Sets up environment variables for client

#### `tailwind.config.js`
- Tailwind CSS configuration
- Scans `pages/` and `components/` for classes
- Custom color theme (blue→purple gradient)

#### `postcss.config.js`
- PostCSS config for Tailwind processing

#### `vercel.json`
- Vercel deployment configuration
- Lists all required environment variables

### Database

#### `database_schema.sql`
Creates 4 tables:

**users** - User accounts
- `id` (UUID)
- `username` (unique)
- `password_hash`
- `created_at`

**sessions** - User sessions
- `id` (UUID)
- `user_id` (FK → users)
- `created_at`
- `expires_at` (30 days)

**checkins** - Check-in records
- `id` (UUID)
- `user_id` (FK → users)
- `checkin_number` (1, 2, 3)
- `is_completed` (boolean)
- `unlocked_at` (datetime)
- `completed_at` (nullable)

**checkins_data** - Check-in responses
- `id` (UUID)
- `checkin_id` (FK → checkins)
- `user_id` (FK → users)
- `data` (JSON)
- `audio_url` (nullable, for S3 files)

Also creates indexes for performance optimization.

### Documentation

#### `README.md`
- Complete project overview
- Architecture explanation
- Setup instructions
- Feature list
- Security notes
- Troubleshooting

#### `QUICK_START.md`
- 5-minute quick setup
- Common issues table
- File editing guide

#### `DEPLOYMENT.md`
- Step-by-step Vercel deployment
- Alternative platform options
- Post-deployment checklist
- Performance tips

#### `SETUP_CHECKLIST.md`
- Interactive checklist to follow
- 6 phases with checkboxes
- Exact commands to run
- Troubleshooting guide

#### `API_DOCS.md`
- Complete API endpoint documentation
- Request/response examples
- Status codes
- Data models

## 🔄 Data Flow

### Signup Flow
1. User fills form on `/auth` page
2. POST to `/api/auth/signup`
3. Password hashed with bcrypt
4. User created in `users` table
5. 3 check-ins created in `checkins` table
6. Session created in `sessions` table
7. Cookie set and user redirected to `/dashboard`

### Check-in Flow
1. User clicks check-in 1 on `/dashboard`
2. Redirected to `/checkin/[id]` page
3. User fills form (placeholder now, add later)
4. Clicks "Submit Check-in"
5. POST to `/api/checkin-submit`
6. Mark check-in as completed
7. Store data in `checkins_data` table
8. Update check-in 2's `unlocked_at` to 3 days later
9. Redirect to `/dashboard`
10. User sees check-in 2 now available

## 🛠️ Technologies Used

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Framework | Next.js | 14.0.0 |
| Styling | Tailwind CSS | 3.3.6 |
| Backend | Node.js | (various) |
| Database | PostgreSQL | (Supabase/Neon) |
| Hashing | bcryptjs | 2.4.3 |
| Storage | AWS S3 | v2 |
| IDs | uuid | 9.0.1 |
| Deployment | Vercel | (Platform) |

## ✅ Features Implemented

- ✅ User authentication (signup/login)
- ✅ Password hashing with bcrypt
- ✅ Session management in database
- ✅ 3 check-ins with progressive unlock
- ✅ Beautiful Tailwind CSS UI
- ✅ Check-in status indicators
- ✅ Current check-in highlighting
- ✅ Responsive design
- ✅ AWS S3 integration ready
- ✅ Database schema with relationships
- ✅ Error handling
- ✅ Vercel deployment ready

## 🚀 Ready to

- [ ] Add check-in questions
- [ ] Add audio recording
- [ ] Add analytics
- [ ] Customize colors
- [ ] Deploy to production

## 📝 Notes

- All database operations are parameterized (prevents SQL injection)
- Passwords never stored in plain text
- Sessions expire after 30 days
- Check-in unlock dates calculated dynamically
- S3 integration ready but not yet used in forms
- Email notifications not yet implemented
- Admin dashboard not yet created

---

Created: April 7, 2026
Total Files: ~25 files
Lines of Code: ~1,500+
Setup Time: ~30 minutes
