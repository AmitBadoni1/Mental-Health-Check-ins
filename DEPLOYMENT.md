# Deployment Guide

## Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy a Next.js app. It's free and takes 2 minutes.

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Mental Health Check-ins"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/mental-health-checkins.git

# Push
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" (or "Log In" if you have account)
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account
5. Click "New Project"
6. Select your `mental-health-checkins` repo
7. Click "Import"

### Step 3: Add Environment Variables

1. On the Vercel import screen, click "Environment Variables"
2. Add each variable from your `.env.local`:
   ```
   DATABASE_URL = postgresql://your_user:your_password@your_host:5432/checkin_db?sslmode=require
   DATABASE_SSL = true
   AWS_ACCESS_KEY_ID = AKIA...
   AWS_SECRET_ACCESS_KEY = xxxxxxx
   AWS_REGION = us-east-1
   S3_BUCKET_NAME = your-bucket-name
   NEXT_PUBLIC_API_URL = https://your-project.vercel.app
   ```

3. Click "Deploy"

### Step 4: Wait for Build

Vercel will automatically:
- Install dependencies
- Build the app
- Deploy to edge network

This takes 1-2 minutes. You'll see a green checkmark when done.

### Step 5: Get Your URL

Once deployed, you'll see something like:
```
https://mental-health-checkins.vercel.app
```

This is your live website! Share this link with users.

## Alternative: Deploy to Other Platforms

### Railway.app

1. Go to https://railway.app
2. Create new project from GitHub
3. Add a PostgreSQL database from Railway
4. Set environment variables
5. Deploy

### Render

1. Go to https://render.com
2. Create new web service from GitHub
3. Set environment variables
4. Deploy

### Heroku (with paid dyno)

1. Go to https://heroku.com
2. Create new app
3. Connect GitHub repo
4. Add environment variables
5. Deploy

## Post-Deployment

After deploying, you should:

1. **Test the live site**:
   - Visit your Vercel URL
   - Create account
   - Test check-in workflow

2. **Monitor for errors**:
   - Go to Vercel dashboard
   - Click "Logs" to see any errors
   - Check database connectivity

3. **Custom domain** (optional):
   - Go to Vercel project settings
   - Click "Domains"
   - Add your custom domain

## Troubleshooting Deployment

### Database connection error
- Check all DATABASE_* environment variables in Vercel
- Verify your Postgres database URL is correct
- Make sure firewall allows Vercel IPs

### S3 upload fails
- Check AWS credentials in Vercel environment
- Verify bucket exists
- Check AWS IAM permissions

### Build fails
Check build logs in Vercel:
1. Click your project
2. Click "Deployments"
3. Click failed deployment
4. Click "Logs" to see error

Most common issues:
- Missing environment variables
- Invalid Node version
- Missing dependencies in package.json

## Updating Your Code

After deployment, whenever you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push
```

Vercel automatically redeploys! No need to do anything else.

## Performance Tips

### Optimize images
Use Next.js Image component for better performance

### Add caching headers
Configure in `next.config.js` for static files

### Monitor database
Use your Postgres provider dashboard to monitor queries

### Set up alerts
Vercel can email you if deployments fail

## Security Checklist

Before sharing publicly:
- ✅ Use HTTPS (Vercel does this automatically)
- ✅ Don't commit `.env.local` (we use `.gitignore`)
- ✅ Set strong database password
- ✅ Restrict S3 bucket access
- ✅ Add rate limiting to auth endpoints (optional)
- ✅ Use HTTPS for all API calls (Vercel enforces this)

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Twitter Support**: @vercel
- **Vercel Discord**: https://discord.gg/vercel
