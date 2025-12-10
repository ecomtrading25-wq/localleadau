import type { Request, Response } from "express";
import Stripe from "stripe";
import {
  createSubscription,
  updateSubscriptionStatus,
  getSubscriptionByStripeId,
} from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe webhook handler
 * Processes subscription lifecycle events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] No signature provided");
    return res.status(400).send("No signature");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    res.status(500).send("Webhook processing failed");
  }
}

/**
 * Handle successful checkout session
 * Creates or updates subscription in database
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("[Stripe Webhook] Processing checkout.session.completed");

  const metadata = session.metadata;
  if (!metadata?.organisation_id || !metadata?.plan_id) {
    console.error("[Stripe Webhook] Missing metadata in checkout session");
    return;
  }

  const organisationId = parseInt(metadata.organisation_id);
  const planId = parseInt(metadata.plan_id);
  const billingPeriod = (metadata.billing_period as "monthly" | "annual") || "monthly";

  // Get the subscription from Stripe
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("[Stripe Webhook] No subscription ID in checkout session");
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create subscription in database
  await createSubscription({
    organisationId,
    planId,
    status: stripeSubscription.status as any,
    billingPeriod,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscriptionId,
    trialEndsAt: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
    currentPeriodStart: (stripeSubscription as any).current_period_start ? new Date((stripeSubscription as any).current_period_start * 1000) : new Date(),
    currentPeriodEnd: (stripeSubscription as any).current_period_end ? new Date((stripeSubscription as any).current_period_end * 1000) : new Date(),
  });

  console.log(`[Stripe Webhook] Created subscription for organisation ${organisationId}`);
}

/**
 * Handle successful invoice payment
 * Updates subscription status to active
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[Stripe Webhook] Processing invoice.paid");

  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) {
    return;
  }

  const subscription = await getSubscriptionByStripeId(subscriptionId);
  if (!subscription) {
    console.error(`[Stripe Webhook] Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update subscription status to active
  await updateSubscriptionStatus(subscription.id, "active");

  console.log(`[Stripe Webhook] Updated subscription ${subscription.id} to active`);
}

/**
 * Handle failed invoice payment
 * Updates subscription status to past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[Stripe Webhook] Processing invoice.payment_failed");

  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) {
    return;
  }

  const subscription = await getSubscriptionByStripeId(subscriptionId);
  if (!subscription) {
    console.error(`[Stripe Webhook] Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update subscription status to past_due
  await updateSubscriptionStatus(subscription.id, "past_due");

  console.log(`[Stripe Webhook] Updated subscription ${subscription.id} to past_due`);
}

/**
 * Handle subscription updates
 * Updates subscription details in database
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.updated");

  const subscription = await getSubscriptionByStripeId(stripeSubscription.id);
  if (!subscription) {
    console.error(`[Stripe Webhook] Subscription not found: ${stripeSubscription.id}`);
    return;
  }

  // Update subscription status
  await updateSubscriptionStatus(subscription.id, stripeSubscription.status as any);

  console.log(`[Stripe Webhook] Updated subscription ${subscription.id} status to ${stripeSubscription.status}`);
}

/**
 * Handle subscription deletion/cancellation
 * Updates subscription status to canceled
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.deleted");

  const subscription = await getSubscriptionByStripeId(stripeSubscription.id);
  if (!subscription) {
    console.error(`[Stripe Webhook] Subscription not found: ${stripeSubscription.id}`);
    return;
  }

  // Update subscription status to canceled
  await updateSubscriptionStatus(subscription.id, "canceled");

  console.log(`[Stripe Webhook] Canceled subscription ${subscription.id}`);
}
