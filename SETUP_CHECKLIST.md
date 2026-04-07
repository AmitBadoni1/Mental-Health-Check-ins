# Setup Checklist

Follow this checklist to get your website up and running in ~30 minutes.

## Phase 1: External Services Setup (15 min)

### PostgreSQL Database
- [ ] Choose a free Postgres provider such as Supabase or Neon
- [ ] Create a new project/database
- [ ] Create new database named `checkin_db`
- [ ] Copy the connection string details
  - [ ] DATABASE_URL: `____________________`
- [ ] Open your SQL editor or terminal
- [ ] Run the entire contents of `database_schema.sql`
- [ ] Verify tables exist (should see: users, sessions, checkins, checkins_data)

### AWS S3
- [ ] Go to https://aws.amazon.com
- [ ] Create account (free tier)
- [ ] Go to S3 service
- [ ] Create new bucket named `mental-health-checkins`
- [ ] Note the region (default: us-east-1)
- [ ] Go to IAM → Users → Create user
- [ ] Get Access Key ID: `____________________`
- [ ] Get Secret Access Key: `____________________`
- [ ] Attach S3 permissions to user

## Phase 2: Local Configuration (5 min)

- [ ] In Website directory, copy `.env.local.example` to `.env.local`
  ```bash
  cp .env.local.example .env.local
  ```
- [ ] Open `.env.local` and fill in:
  ```
  DATABASE_URL=postgresql://your_user:your_password@your_host:5432/checkin_db?sslmode=require
  DATABASE_SSL=true
  AWS_ACCESS_KEY_ID=<YOUR_AWS_KEY>
  AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET>
  AWS_REGION=us-east-1
  S3_BUCKET_NAME=mental-health-checkins
  NEXT_PUBLIC_API_URL=http://localhost:3000
  ```

- [ ] Verify `.env.local` is in `.gitignore` (it should be)

## Phase 3: Local Testing (10 min)

- [ ] Open terminal in Website directory
- [ ] Run `npm install` (wait for completion)
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000 in browser
- [ ] Should redirect to login page

### Test Signup
- [ ] Click "Sign Up"
- [ ] Enter any username: `test_user`
- [ ] Enter any password: `password123`
- [ ] Click "Sign Up" button
- [ ] Should create user and redirect to dashboard

### Test Dashboard
- [ ] Should see 3 check-ins
- [ ] Check-in 1: should be **available** (bold)
- [ ] Check-in 2: should be **locked** (grayed out, says "🔒 Locked")
- [ ] Check-in 3: should be **locked** (grayed out, says "🔒 Locked")
- [ ] Current check-in highlighted in blue

### Test Check-in
- [ ] Click on "Check-in 1"
- [ ] Should see empty placeholder with "Submit Check-in" button
- [ ] Click "Submit Check-in"
- [ ] Should see green success message
- [ ] Should redirect back to dashboard
- [ ] Check-in 1: should now show "✓ Complete"
- [ ] Check-in 2: should now say "Unlocks on [date 3 days from now]"

### Test Login/Logout
- [ ] Click "Logout" button
- [ ] Should redirect to login page
- [ ] Enter username: `test_user`
- [ ] Enter password: `password123`
- [ ] Click "Login"
- [ ] Should see dashboard with same check-in status as before

- [ ] **All tests passed!** ✅

## Phase 4: Prepare for Deployment (5 min)

- [ ] Create GitHub account (if don't have one): https://github.com
- [ ] Create new GitHub repository
- [ ] Initialize git in Website directory:
  ```bash
  git init
  git add .
  git commit -m "Initial commit: Mental Health Check-ins"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/mental-health-checkins.git
  git push -u origin main
  ```

- [ ] Verify files are on GitHub (check your repo)
- [ ] Make sure `.env.local` is NOT on GitHub (should be ignored)

## Phase 5: Deploy to Vercel (5 min)

- [ ] Go to https://vercel.com
- [ ] Sign up / Log in with GitHub
- [ ] Click "New Project"
- [ ] Select `mental-health-checkins` repository
- [ ] Click "Import"
- [ ] Add Environment Variables (copy from your `.env.local`):
  ```
  DATABASE_HOST = [value]
  DATABASE_USER = root
  DATABASE_PASSWORD = [value]
  DATABASE_NAME = checkin_db
  AWS_ACCESS_KEY_ID = [value]
  AWS_SECRET_ACCESS_KEY = [value]
  AWS_REGION = us-east-1
  S3_BUCKET_NAME = mental-health-checkins
  NEXT_PUBLIC_API_URL = https://[your-project].vercel.app
  ```
  (Note: Don't know the final URL yet, use placeholder and update later)

- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for deployment
- [ ] Should see green checkmark ✅
- [ ] Copy your Vercel URL: `https://____________________`

### Verify Deployment
- [ ] Visit your Vercel URL
- [ ] Should see login page
- [ ] Create account and test same flow as local
- [ ] All tests should pass ✅

## Phase 6: Add Check-in Questions (Optional, but recommended)

- [ ] Edit `pages/checkin/[id].js`
- [ ] Find the comment: `{/* Placeholder for check-in questions */}`
- [ ] Add your questions (text inputs, radio buttons, etc.)
- [ ] Save and commit:
  ```bash
  git add pages/checkin/[id].js
  git commit -m "Add check-in questions"
  git push
  ```
- [ ] Vercel will auto-deploy your changes
- [ ] Test on your live site

## Optional: Custom Domain

- [ ] After everything works, buy domain (Namecheap, GoDaddy, etc.)
- [ ] In Vercel project settings → Domains
- [ ] Add your custom domain
- [ ] Follow Vercel's DNS configuration instructions
- [ ] Test your domain

## Share with Users

Once live, you can share your URL with users:
- `https://your-domain.vercel.app`
- They can sign up and start check-ins
- Check-in 1 available immediately
- Check-in 2 unlocks 3 days after completing check-in 1

## Troubleshooting

| Problem | Solution |
|---------|----------|
| npm install fails | Delete `node_modules` and `package-lock.json`, try again |
| Database connection error | Verify `.env.local` credentials, check your Postgres connection URL |
| Can't see check-ins | Check browser console for errors (F12) |
| S3 upload fails | Verify AWS credentials, check IAM permissions |
| Vercel deployment fails | Click deployment → "Logs" to see error |

## Done! 🎉

Your mental health check-in website is now live!

**Next steps:**
1. Monitor user signups and check-ins
2. Add more detailed questions as needed
3. Implement audio recording feature (see README.md)
4. Add analytics dashboard (optional)
5. Set up monitoring/alerting

Need help? Check:
- README.md for full documentation
- API_DOCS.md for API details
- QUICK_START.md for quick reference
