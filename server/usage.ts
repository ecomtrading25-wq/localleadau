import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { prospects, leads, campaigns, subscriptions, billingPlans } from "../drizzle/schema";
import { getBillingPlanById } from "./db";

/**
 * Get current usage statistics for an organisation
 */
export async function getOrganisationUsage(organisationId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get current billing period start date
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .orderBy(sql`${subscriptions.createdAt} DESC`)
    .limit(1);

  const currentPeriodStart = subscription[0]?.currentPeriodStart || new Date(0);

  // Count prospects (all time)
  const prospectCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospects)
    .where(eq(prospects.organisationId, organisationId));

  // Count leads created this billing period
  const leadCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.organisationId, organisationId),
        gte(leads.createdAt, currentPeriodStart)
      )
    );

  // Count active campaigns
  const campaignCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.organisationId, organisationId),
        sql`${campaigns.status} IN ('draft', 'active')`
      )
    );

  return {
    prospects: Number(prospectCount[0]?.count || 0),
    leads: Number(leadCount[0]?.count || 0),
    campaigns: Number(campaignCount[0]?.count || 0),
    currentPeriodStart,
  };
}

/**
 * Get plan limits for an organisation
 */
export async function getOrganisationLimits(organisationId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get active subscription
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .orderBy(sql`${subscriptions.createdAt} DESC`)
    .limit(1);

  if (!subscription[0]) {
    // No subscription - return default free limits
    return {
      maxProspects: 50,
      maxLeads: 10,
      maxCampaigns: 1,
      unlimited: false,
    };
  }

  // Get plan details
  const plan = await getBillingPlanById(subscription[0].planId);

  if (!plan) {
    throw new Error("Plan not found");
  }

  return {
    maxProspects: plan.maxRegions === -1 ? -1 : plan.maxRegions * 500, // 500 prospects per region
    maxLeads: plan.maxLeadsPerMonth,
    maxCampaigns: plan.maxNiches === -1 ? -1 : plan.maxNiches * 10, // 10 campaigns per niche
    unlimited: plan.maxLeadsPerMonth === -1,
  };
}

/**
 * Check if organisation can perform an action based on limits
 */
export async function checkUsageLimit(
  organisationId: number,
  action: "prospect" | "lead" | "campaign",
  count: number = 1
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  const usage = await getOrganisationUsage(organisationId);
  const limits = await getOrganisationLimits(organisationId);

  switch (action) {
    case "prospect":
      if (limits.maxProspects === -1) {
        return { allowed: true };
      }
      if (usage.prospects + count > limits.maxProspects) {
        return {
          allowed: false,
          reason: `Prospect limit exceeded. You have ${usage.prospects} prospects and your plan allows ${limits.maxProspects}.`,
          current: usage.prospects,
          limit: limits.maxProspects,
        };
      }
      return { allowed: true };

    case "lead":
      if (limits.maxLeads === -1) {
        return { allowed: true };
      }
      if (usage.leads + count > limits.maxLeads) {
        return {
          allowed: false,
          reason: `Monthly lead limit exceeded. You have created ${usage.leads} leads this billing period and your plan allows ${limits.maxLeads} per month.`,
          current: usage.leads,
          limit: limits.maxLeads,
        };
      }
      return { allowed: true };

    case "campaign":
      if (limits.maxCampaigns === -1) {
        return { allowed: true };
      }
      if (usage.campaigns + count > limits.maxCampaigns) {
        return {
          allowed: false,
          reason: `Campaign limit exceeded. You have ${usage.campaigns} active campaigns and your plan allows ${limits.maxCampaigns}.`,
          current: usage.campaigns,
          limit: limits.maxCampaigns,
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Get usage percentage for display
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  return Math.min(Math.round((current / limit) * 100), 100);
}

/**
 * Check if usage is approaching limit (>80%)
 */
export function isApproachingLimit(current: number, limit: number): boolean {
  if (limit === -1) return false;
  return getUsagePercentage(current, limit) >= 80;
}

/**
 * Check if usage has exceeded limit
 */
export function hasExceededLimit(current: number, limit: number): boolean {
  if (limit === -1) return false;
  return current >= limit;
}
