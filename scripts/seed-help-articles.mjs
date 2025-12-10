import { drizzle } from "drizzle-orm/mysql2";
import { helpArticles } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const articles = [
  {
    title: "Getting Started with Local Lead AU",
    slug: "getting-started",
    category: "getting_started",
    body: `# Getting Started with Local Lead AU

Welcome to Local Lead AU! This guide will help you get up and running in minutes.

## Step 1: Complete Your Profile

After signing up, you'll be guided through a 5-step onboarding wizard:

1. **Business Information** - Enter your business name, industry, website, and ABN
2. **Service Areas** - Define where you operate (cities, suburbs, radius)
3. **Job Types** - Specify your services and average job values
4. **Lead Handling** - Set your preferences for receiving and managing leads
5. **Review** - Confirm your settings and complete setup

## Step 2: Find Your First Prospects

Once onboarded, head to the **Prospects** page to start finding potential customers:

1. Enter a business type (e.g., "plumber", "electrician")
2. Enter a location (e.g., "Sydney", "Melbourne")
3. Click **Search** to scrape Google Maps
4. Review the results and qualify prospects

## Step 3: Convert Prospects to Leads

When you find promising prospects:

1. Click the **Actions** menu on any prospect
2. Select **Convert to Lead**
3. The prospect becomes a lead in your pipeline

## Step 4: Create Your First Campaign

Nurture leads with automated email sequences:

1. Go to **Campaigns** page
2. Click **Create Campaign**
3. Add email steps with delays between them
4. Add leads to the campaign

## Need Help?

Browse our [Help Center](/help) or contact support at support@locallead.au`,
    published: true,
  },
  {
    title: "How to Find Prospects with Google Maps",
    slug: "how-to-find-prospects",
    category: "features",
    body: `# How to Find Prospects with Google Maps

Local Lead AU uses Google Maps to help you discover potential customers in your area.

## Starting a Search

1. Navigate to the **Prospects** page from your dashboard
2. Enter a **business type** (e.g., "plumber", "cafe", "dentist")
3. Enter a **location** (city, suburb, or postcode)
4. Click **Search Prospects**

## What Happens Next

The system creates a background scrape job that:

- Searches Google Maps for matching businesses
- Extracts business details (name, phone, website, address, rating)
- Saves results to your prospects table
- Typically completes in 30-60 seconds

## Reviewing Results

Once the scrape completes, you'll see a table of prospects with:

- **Business Name** - The name of the business
- **Phone** - Contact number (if available)
- **Website** - Business website (if available)
- **Address** - Physical location
- **Rating** - Google Maps rating (out of 5 stars)
- **Status** - New, Qualified, or Excluded

## Managing Prospects

For each prospect, you can:

- **Qualify** - Mark as a good fit for outreach
- **Exclude** - Remove from consideration
- **Convert to Lead** - Move into your sales pipeline

## Tips for Better Results

- Be specific with business types (e.g., "emergency plumber" vs "plumber")
- Search multiple locations to build a larger prospect list
- Use the filters to focus on high-rated businesses
- Regularly qualify/exclude prospects to keep your list clean

## Usage Limits

Your plan includes a monthly prospect limit:

- **Starter**: 500 prospects/month
- **Professional**: 2,000 prospects/month
- **Enterprise**: Unlimited prospects

Check your usage in the dashboard widget.`,
    published: true,
  },
  {
    title: "Creating and Managing Email Campaigns",
    slug: "creating-campaigns",
    category: "features",
    body: `# Creating and Managing Email Campaigns

Automate your outreach with multi-step email sequences that nurture leads over time.

## Creating a Campaign

1. Go to **Campaigns** page
2. Click **Create New Campaign**
3. Enter a campaign name (e.g., "Q1 Plumber Outreach")
4. Set status to **Draft** while building

## Adding Campaign Steps

Each campaign can have multiple steps (emails) with delays between them:

1. Click **Add Step** on your campaign
2. Enter a **subject line**
3. Write your **email body** (HTML supported)
4. Set **delay** (days to wait after previous step)
5. Save the step

### Example 3-Step Sequence

**Step 1** (Day 0):
- Subject: "Quick question about your plumbing business"
- Body: Introduction and value proposition
- Delay: 0 days

**Step 2** (Day 3):
- Subject: "Following up - free lead generation audit"
- Body: Offer specific value
- Delay: 3 days

**Step 3** (Day 7):
- Subject: "Last chance - are you interested?"
- Body: Final call to action
- Delay: 4 days

## Using Template Variables

Personalize emails with dynamic variables:

- \`{{firstName}}\` - Lead's first name
- \`{{businessName}}\` - Lead's business name
- \`{{city}}\` - Lead's city
- \`{{state}}\` - Lead's state
- \`{{phone}}\` - Lead's phone number

### Example

\`\`\`
Hi {{firstName}},

I noticed {{businessName}} in {{city}} and wanted to reach out...
\`\`\`

## Adding Leads to Campaigns

1. Go to **Leads** page
2. Select leads you want to add
3. Click **Add to Campaign**
4. Choose your campaign

## Activating a Campaign

Once your steps are ready:

1. Review all steps and content
2. Change status from **Draft** to **Active**
3. The system will automatically send emails based on your schedule

## Monitoring Performance

Track campaign metrics:

- **Recipients** - Total leads in campaign
- **Sent** - Emails delivered
- **Pending** - Emails scheduled
- **Failed** - Delivery failures

## Campaign Limits

Your plan includes a monthly campaign limit:

- **Starter**: 5 active campaigns
- **Professional**: 20 active campaigns
- **Enterprise**: Unlimited campaigns

## Best Practices

- Keep subject lines under 50 characters
- Personalize with template variables
- Test with a small group first
- Space steps 2-4 days apart
- Always include an unsubscribe link (automatically added)`,
    published: true,
  },
  {
    title: "Managing Your Subscription and Billing",
    slug: "managing-subscription",
    category: "billing",
    body: `# Managing Your Subscription and Billing

Learn how to manage your Local Lead AU subscription, upgrade plans, and handle billing.

## Viewing Your Current Plan

1. Go to **Billing** page from the dashboard
2. See your current plan, usage, and billing cycle

## Available Plans

### Starter - $99/month
- 500 prospects/month
- 100 leads/month
- 5 active campaigns
- Email support

### Professional - $299/month
- 2,000 prospects/month
- 500 leads/month
- 20 active campaigns
- Priority support
- Custom branding

### Enterprise - $599/month
- Unlimited prospects
- Unlimited leads
- Unlimited campaigns
- Dedicated account manager
- White-label option
- API access

## Upgrading Your Plan

1. Go to **Billing** page
2. Click **Upgrade** on your desired plan
3. Complete Stripe checkout
4. Your new limits apply immediately

## Downgrading Your Plan

1. Go to **Billing** page
2. Click **Manage Subscription**
3. This opens the Stripe billing portal
4. Select a lower plan
5. Changes take effect at next billing cycle

## Managing Payment Methods

1. Go to **Billing** page
2. Click **Manage Subscription**
3. In the Stripe portal, you can:
   - Update credit card
   - View invoice history
   - Download receipts

## Usage Tracking

Monitor your usage against plan limits:

- **Dashboard Widget** - Shows current usage with progress bars
- **Color Coding** - Green (< 70%), Yellow (70-90%), Red (> 90%)
- **Upgrade Prompts** - Automatic alerts when approaching limits

## What Happens When You Hit Limits?

When you exceed your plan limits:

- **Prospects** - Cannot create new scrape jobs
- **Leads** - Cannot convert more prospects
- **Campaigns** - Cannot create new campaigns

You'll see clear upgrade prompts with direct links to billing.

## Billing Cycle

- **Monthly** - Billed on the same day each month
- **Annual** - Save 20% with annual billing (coming soon)

## Cancellation Policy

You can cancel anytime:

1. Go to Stripe billing portal
2. Click **Cancel Subscription**
3. Access continues until end of billing period
4. Data is retained for 90 days

## Need Help?

Contact our billing team at billing@locallead.au or visit the [Help Center](/help).`,
    published: true,
  },
  {
    title: "Troubleshooting Common Issues",
    slug: "troubleshooting",
    category: "troubleshooting",
    body: `# Troubleshooting Common Issues

Quick solutions to common problems you might encounter.

## Prospects Not Loading

**Problem:** Scrape job stays in "pending" or "running" status

**Solutions:**
1. Wait 60-90 seconds - scraping takes time
2. Refresh the page to see updated status
3. Check if you've hit your monthly prospect limit
4. Try a more specific search term

## Emails Not Sending

**Problem:** Campaign emails aren't being delivered

**Solutions:**
1. Check campaign status is **Active** (not Draft or Paused)
2. Verify leads are added to the campaign
3. Check if step delays have elapsed
4. Review your email content for spam triggers
5. Ensure you haven't exceeded sending limits

## Can't Convert Prospect to Lead

**Problem:** "Convert to Lead" button is disabled

**Solutions:**
1. Check if you've hit your monthly lead limit
2. Upgrade your plan to increase limits
3. Verify the prospect isn't already a lead

## Login Issues

**Problem:** Can't sign in or getting errors

**Solutions:**
1. Clear browser cache and cookies
2. Try a different browser
3. Check if you're using the correct login method
4. Contact support if issue persists

## Onboarding Wizard Not Showing

**Problem:** Redirected to dashboard instead of onboarding

**Solutions:**
1. You may have already completed onboarding
2. Check your organisation settings
3. Contact support to reset onboarding status

## Payment Declined

**Problem:** Stripe checkout fails

**Solutions:**
1. Verify card details are correct
2. Check with your bank for restrictions
3. Try a different payment method
4. Use test card 4242 4242 4242 4242 in test mode

## Usage Widget Shows Incorrect Data

**Problem:** Usage numbers seem wrong

**Solutions:**
1. Refresh the page
2. Check if you're viewing the correct organisation
3. Usage resets monthly on your billing date
4. Contact support if numbers are still incorrect

## SEO Pages Not Loading

**Problem:** 404 error on pSEO pages

**Solutions:**
1. Verify pages have been generated (visit /pseo-admin)
2. Check the URL format (should be /niche-location)
3. Ensure page is marked as "published"

## Still Need Help?

If these solutions don't resolve your issue:

1. Check the [Help Center](/help) for more articles
2. Email support@locallead.au with:
   - Description of the problem
   - Steps to reproduce
   - Screenshots if applicable
   - Your organisation name

We typically respond within 24 hours (faster for Professional and Enterprise customers).`,
    published: true,
  },
];

async function seedHelpArticles() {
  console.log("[Help Seeder] Starting help article seeding...");
  
  for (const article of articles) {
    try {
      await db.insert(helpArticles).values(article);
      console.log(`[Help Seeder] Created: ${article.title}`);
    } catch (error) {
      console.log(`[Help Seeder] Skipped (already exists): ${article.title}`);
    }
  }
  
  console.log(`[Help Seeder] Complete! Seeded ${articles.length} help articles.`);
}

seedHelpArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[Help Seeder] Error:", error);
    process.exit(1);
  });
