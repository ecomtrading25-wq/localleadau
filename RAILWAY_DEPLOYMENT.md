# Railway Deployment Guide - Local Lead AU

This guide will walk you through deploying the Local Lead AU platform to Railway.

---

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account
- SendGrid API key
- Stripe API keys (test or production)

---

## Step 1: Push Code to GitHub

1. Create a new GitHub repository
2. Push the Local Lead AU code:

```bash
cd /home/ubuntu/localleadau
git init
git add .
git commit -m "Initial commit - Local Lead AU platform"
git remote add origin https://github.com/YOUR_USERNAME/localleadau.git
git push -u origin main
```

---

## Step 2: Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select your `localleadau` repository
4. Railway will automatically detect the Node.js project

---

## Step 3: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "MySQL"**
3. Railway will provision a MySQL database
4. Copy the `DATABASE_URL` connection string

---

## Step 4: Configure Environment Variables

In Railway project settings → Variables, add the following:

### Required Variables

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<from Railway MySQL service>
```

### Authentication & Security

```
JWT_SECRET=<generate a random 32-character string>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=<your Manus app ID or create new OAuth app>
OWNER_OPEN_ID=<your user ID>
OWNER_NAME=<your name>
```

### Email (SendGrid)

```
SENDGRID_API_KEY=<your SendGrid API key>
```

### Payments (Stripe)

```
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_WEBHOOK_SECRET=<your Stripe webhook secret>
VITE_STRIPE_PUBLISHABLE_KEY=<your Stripe publishable key>
```

### Manus Built-in APIs (Optional - for advanced features)

```
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=<your Manus API key>
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your Manus frontend API key>
```

### App Branding

```
VITE_APP_TITLE=Local Lead AU
VITE_APP_LOGO=<URL to your logo>
```

### Analytics (Optional)

```
VITE_ANALYTICS_ENDPOINT=<your analytics endpoint>
VITE_ANALYTICS_WEBSITE_ID=<your website ID>
```

---

## Step 5: Run Database Migrations

After the first deployment, you need to run migrations:

1. In Railway, go to your web service
2. Click **"Settings" → "Deploy Triggers"**
3. Add a one-time command:

```bash
pnpm db:push
```

Or use Railway CLI:

```bash
railway run pnpm db:push
```

---

## Step 6: Seed Initial Data

Run these commands to populate initial data:

```bash
# Seed billing plans
railway run pnpm exec tsx scripts/seed-billing-plans.mjs

# Seed pSEO data (niches and locations)
railway run pnpm exec tsx scripts/seed-pseo-data.mjs

# Generate all SEO pages
railway run pnpm exec tsx scripts/generate-all-pages.mjs

# Seed help articles
railway run pnpm exec tsx scripts/seed-help-articles.mjs
```

---

## Step 7: Configure Custom Domain (Optional)

1. In Railway project → Settings → Domains
2. Click **"Generate Domain"** for a free `.railway.app` domain
3. Or click **"Custom Domain"** to add your own domain
4. Update DNS records as instructed

---

## Step 8: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **"Add endpoint"**
3. Enter your Railway URL: `https://your-app.railway.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add it to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 9: Verify Deployment

1. Visit your Railway app URL
2. Test the onboarding flow
3. Try searching for prospects
4. Create a test campaign
5. Verify billing page loads

---

## Troubleshooting

### Build Fails

- Check Railway build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check if migrations have been run
- Ensure MySQL service is running

### OAuth Login Not Working

- Verify `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL` are correct
- Check `VITE_APP_ID` matches your OAuth app
- Ensure redirect URLs are configured in OAuth app settings

### Emails Not Sending

- Verify `SENDGRID_API_KEY` is valid
- Check SendGrid account is verified
- Review Railway logs for email errors

### Stripe Checkout Fails

- Verify Stripe keys are correct (test vs production)
- Check if billing plans are seeded
- Ensure webhook endpoint is configured

---

## Monitoring & Logs

### View Logs

```bash
railway logs
```

Or in Railway dashboard → Deployments → View Logs

### Monitor Performance

- Railway provides built-in metrics (CPU, memory, network)
- Set up alerts for errors and downtime

---

## Scaling

Railway automatically scales based on traffic. To configure:

1. Go to Settings → Resources
2. Adjust CPU and memory limits
3. Enable autoscaling if needed

---

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month + usage
- **MySQL Database**: ~$5-10/month
- **Web Service**: ~$5-20/month (depending on traffic)

**Estimated total**: $15-35/month for low-moderate traffic

---

## Alternative: Using Railway CLI

### Install Railway CLI

```bash
npm install -g @railway/cli
```

### Login

```bash
railway login
```

### Link Project

```bash
cd /home/ubuntu/localleadau
railway link
```

### Deploy

```bash
railway up
```

### Run Commands

```bash
railway run pnpm db:push
railway run pnpm exec tsx scripts/seed-billing-plans.mjs
```

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Billing plans seeded
- [ ] pSEO data seeded and pages generated
- [ ] Help articles created
- [ ] Stripe webhooks configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic on Railway)
- [ ] Test complete user journey
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry, LogRocket, etc.)

---

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

For Local Lead AU issues:
- Check application logs
- Review environment variables
- Verify all seed scripts have run

---

**Deployment prepared by Manus AI - December 11, 2025**
