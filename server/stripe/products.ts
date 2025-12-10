/**
 * Stripe Products & Pricing Configuration
 * 
 * This file defines all subscription plans for Local Lead AU.
 * Prices are in cents (AUD).
 */

export const BILLING_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started with lead generation',
    price: 9900, // $99/month in cents
    currency: 'aud',
    interval: 'month' as const,
    features: [
      'Up to 500 prospects per month',
      'Up to 100 leads',
      '2 active campaigns',
      'Email support',
      'Basic analytics',
    ],
    limits: {
      prospects: 500,
      leads: 100,
      campaigns: 2,
      users: 1,
    },
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses that need more power and features',
    price: 29900, // $299/month in cents
    currency: 'aud',
    interval: 'month' as const,
    features: [
      'Up to 2,000 prospects per month',
      'Up to 500 leads',
      '10 active campaigns',
      'Priority email support',
      'Advanced analytics',
      'Team collaboration (up to 3 users)',
      'Custom email templates',
    ],
    limits: {
      prospects: 2000,
      leads: 500,
      campaigns: 10,
      users: 3,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For established businesses with high-volume lead generation needs',
    price: 59900, // $599/month in cents
    currency: 'aud',
    interval: 'month' as const,
    features: [
      'Unlimited prospects',
      'Unlimited leads',
      'Unlimited campaigns',
      'Phone & email support',
      'Advanced analytics & reporting',
      'Unlimited team members',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
    ],
    limits: {
      prospects: -1, // -1 means unlimited
      leads: -1,
      campaigns: -1,
      users: -1,
    },
  },
} as const;

export type BillingPlanId = keyof typeof BILLING_PLANS;

/**
 * Get plan details by ID
 */
export function getPlanById(planId: string) {
  const plan = BILLING_PLANS[planId.toUpperCase() as BillingPlanId];
  return plan || null;
}

/**
 * Check if a plan allows a specific usage
 */
export function checkPlanLimit(
  planId: string,
  limitType: 'prospects' | 'leads' | 'campaigns' | 'users',
  currentUsage: number
): { allowed: boolean; limit: number } {
  const plan = getPlanById(planId);
  
  if (!plan) {
    return { allowed: false, limit: 0 };
  }

  const limit = plan.limits[limitType];
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1 };
  }

  return {
    allowed: currentUsage < limit,
    limit,
  };
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number, currency: string = 'AUD'): string {
  const amount = priceInCents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount);
}
