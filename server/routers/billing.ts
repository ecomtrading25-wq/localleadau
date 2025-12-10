import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import {
  createSubscription,
  getSubscriptionByOrganisation,
  updateSubscriptionStatus,
  getBillingPlans,
  getBillingPlanById,
} from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const billingRouter = router({
  // Get all available plans
  getPlans: protectedProcedure.query(async () => {
    const plans = await getBillingPlans();
    return plans.map(plan => ({
      ...plan,
      priceMonthlyFormatted: formatPrice(plan.priceMonthly),
      priceAnnualFormatted: formatPrice(plan.priceAnnual),
      featuresArray: plan.features ? JSON.parse(plan.features) : [],
    }));
  }),

  // Get current subscription for an organisation
  getCurrentSubscription: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
    }))
    .query(async ({ input }) => {
      const subscription = await getSubscriptionByOrganisation(input.organisationId);
      
      if (!subscription) {
        return null;
      }

      const plan = await getBillingPlanById(subscription.planId);
      
      return {
        ...subscription,
        plan: plan ? {
          ...plan,
          priceMonthlyFormatted: formatPrice(plan.priceMonthly),
          priceAnnualFormatted: formatPrice(plan.priceAnnual),
          featuresArray: plan.features ? JSON.parse(plan.features) : [],
        } : null,
      };
    }),

  // Create Stripe checkout session
  createCheckoutSession: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      planId: z.number(),
      billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
    }))
    .mutation(async ({ input, ctx }) => {
      const plan = await getBillingPlanById(input.planId);
      
      if (!plan) {
        throw new Error("Invalid plan selected");
      }

      // Create or retrieve Stripe customer
      let customerId: string;
      
      const existingSubscription = await getSubscriptionByOrganisation(input.organisationId);
      
      if (existingSubscription?.stripeCustomerId) {
        customerId = existingSubscription.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
            organisation_id: input.organisationId.toString(),
          },
        });
        customerId = customer.id;
      }

      // Use the stored Stripe price ID
      const priceId = input.billingPeriod === 'monthly' 
        ? plan.stripePriceIdMonthly 
        : plan.stripePriceIdAnnual;

      if (!priceId) {
        throw new Error("Stripe price not configured for this plan");
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${ctx.req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.req.headers.origin}/billing`,
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          organisation_id: input.organisationId.toString(),
          plan_id: plan.id.toString(),
          billing_period: input.billingPeriod,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  // Create Stripe billing portal session
  createPortalSession: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const subscription = await getSubscriptionByOrganisation(input.organisationId);
      
      if (!subscription?.stripeCustomerId) {
        throw new Error("No active subscription found");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${ctx.req.headers.origin}/billing`,
      });

      return {
        url: session.url,
      };
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const subscription = await getSubscriptionByOrganisation(input.organisationId);
      
      if (!subscription?.stripeSubscriptionId) {
        throw new Error("No active subscription found");
      }

      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await updateSubscriptionStatus(subscription.id, 'canceled');

      return { success: true };
    }),
});

/**
 * Format price for display
 */
function formatPrice(priceInCents: number, currency: string = 'AUD'): string {
  const amount = priceInCents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount);
}
