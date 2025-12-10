import { drizzle } from 'drizzle-orm/mysql2';
import { billingPlans } from '../drizzle/schema.js';
import 'dotenv/config';

const db = drizzle(process.env.DATABASE_URL);

const plans = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small businesses getting started with lead generation',
    priceMonthly: 9900, // $99/month in cents
    priceAnnual: 99000, // $990/year in cents (2 months free)
    maxNiches: 1,
    maxRegions: 3,
    maxLeadsPerMonth: 100,
    features: JSON.stringify([
      'Up to 500 prospects per month',
      'Up to 100 leads',
      '2 active campaigns',
      'Email support',
      'Basic analytics',
    ]),
    active: true,
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'For growing businesses that need more power and features',
    priceMonthly: 29900, // $299/month in cents
    priceAnnual: 299000, // $2,990/year in cents (2 months free)
    maxNiches: 3,
    maxRegions: 10,
    maxLeadsPerMonth: 500,
    features: JSON.stringify([
      'Up to 2,000 prospects per month',
      'Up to 500 leads',
      '10 active campaigns',
      'Priority email support',
      'Advanced analytics',
      'Team collaboration (up to 3 users)',
      'Custom email templates',
    ]),
    active: true,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For established businesses with high-volume lead generation needs',
    priceMonthly: 59900, // $599/month in cents
    priceAnnual: 599000, // $5,990/year in cents (2 months free)
    maxNiches: -1, // unlimited
    maxRegions: -1, // unlimited
    maxLeadsPerMonth: -1, // unlimited
    features: JSON.stringify([
      'Unlimited prospects',
      'Unlimited leads',
      'Unlimited campaigns',
      'Phone & email support',
      'Advanced analytics & reporting',
      'Unlimited team members',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
    ]),
    active: true,
  },
];

async function seed() {
  console.log('Seeding billing plans...');
  
  for (const plan of plans) {
    try {
      await db.insert(billingPlans).values(plan);
      console.log(`✓ Created plan: ${plan.name}`);
    } catch (error) {
      console.log(`Plan ${plan.name} might already exist, skipping...`);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding plans:', error);
  process.exit(1);
});
