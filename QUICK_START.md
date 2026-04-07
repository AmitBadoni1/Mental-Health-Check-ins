# Quick Start Guide

## What was created?

A complete, ready-to-deploy mental health check-in website with:
- ✅ User signup/login
- ✅ 3 check-ins with progressive unlock (3 days apart)
- ✅ Beautiful UI with current check-in highlighted
- ✅ Database backend with PostgreSQL
- ✅ AWS S3 support for audio files
- ✅ Deployable to Vercel

## Quick Setup (5 minutes)

### Step 1: Set up Database

1. Choose a free Postgres provider such as Supabase or Neon
2. Create a new project/database
3. Find your connection string (you'll see a database URL value)
4. Run the database schema:
   ```sql
   -- Copy entire contents of database_schema.sql and paste here
   ```
   Or use your provider's SQL editor

### Step 2: Set up AWS S3

1. Go to https://aws.amazon.com and create account
2. Go to S3 service and create a new bucket (e.g., `mental-health-checkins`)
3. Note your:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Bucket name
   - Region (default: us-east-1)

### Step 3: Configure Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in all values:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.iplmxxittahjnuyyhggk.supabase.co:5432/postgres
   sslmode=require
   DATABASE_SSL=true
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=mental-health-checkins
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Step 4: Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000 and test:
1. Create account (any username/password)
2. See dashboard with 3 check-ins
3. Check-in 1 is available, others locked
4. Click "Click to start" on check-in 1
5. Click "Submit Check-in" button
6. Check-in 2 should now be unlocked

### Step 5: Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. Go to https://vercel.com
3. Click "New Project" and import your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Click "Deploy"
6. Done! Your site is live with a `.vercel.app` domain

## File Structure Overview

```
Website/
├── pages/              # React pages and API routes
├── lib/                # Utilities (database, S3)
├── styles/             # CSS (Tailwind)
├── package.json        # Dependencies
└── database_schema.sql # Database setup
```

## Add Check-in Questions Later

Edit `pages/checkin/[id].js` placeholder section to add:
- Text inputs
- Radio buttons
- Checkboxes
- Audio recorder
- Or anything else you need!

## Common Issues

| Problem | Solution |
|---------|----------|
| "Can't connect to database" | Check `.env.local` has correct Postgres credentials |
| "S3 upload fails" | Verify AWS credentials and bucket name in `.env.local` |
| "Session expires immediately" | Clear cookies or restart dev server |
| "npm install fails" | Delete `node_modules` and `package-lock.json`, then try again |

## Where to Add Functionality

| Feature | File to Edit |
|---------|-------------|
| Add check-in questions | `pages/checkin/[id].js` |
| Change styling/colors | `tailwind.config.js` or add Tailwind classes |
| Add audio recording | `pages/checkin/[id].js` (use `lib/s3.js` for upload) |
| Modify unlock schedule | `pages/api/auth/signup.js` line 44 |
| Change number of check-ins | `pages/api/auth/signup.js` and `database_schema.sql` |

## Next Actions

1. ✅ Set up database (Supabase/Neon)
2. ✅ Set up AWS S3
3. ✅ Run locally to test
4. ✅ Deploy to Vercel
5. 📝 Add your check-in questions (`pages/checkin/[id].js`)
6. 🎤 Add audio recording (optional)
7. 📊 Add analytics dashboard (optional)

## Questions?

Each file has comments explaining what it does. The README.md has detailed information about the entire architecture.

Good luck! 🚀
