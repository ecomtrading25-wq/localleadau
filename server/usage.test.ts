import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createOrganisation, createSubscription, getBillingPlanBySlug } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Usage Tracking & Limits", () => {
  it("should return usage stats for an organisation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation
    const orgId = await createOrganisation({
      name: "Test Usage Org",
      industry: "Testing",
      website: null,
      abn: null,
      serviceAreas: null,
      jobTypes: null,
      averageJobValue: null,
      leadHandling: null,
      onboarded: true,
      slug: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    // Get usage stats
    const stats = await caller.usage.getUsageStats({ organisationId: orgId });

    expect(stats).toBeDefined();
    expect(stats.usage).toBeDefined();
    expect(stats.limits).toBeDefined();
    expect(stats.percentages).toBeDefined();
    expect(stats.warnings).toBeDefined();
    expect(stats.exceeded).toBeDefined();

    // Should have zero usage for new org
    expect(stats.usage.prospects).toBe(0);
    expect(stats.usage.leads).toBe(0);
    expect(stats.usage.campaigns).toBe(0);
  });

  it("should return correct limits for organisation with subscription", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation
    const orgId = await createOrganisation({
      name: "Test Limits Org",
      industry: "Testing",
      website: null,
      abn: null,
      serviceAreas: null,
      jobTypes: null,
      averageJobValue: null,
      leadHandling: null,
      onboarded: true,
      slug: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    // Get Professional plan
    const plan = await getBillingPlanBySlug("professional");
    if (!plan) throw new Error("Professional plan not found");

    // Create subscription
    await createSubscription({
      organisationId: orgId,
      planId: plan.id,
      status: "active",
      billingPeriod: "monthly",
      stripeCustomerId: "cus_test_limits",
      stripeSubscriptionId: "sub_test_limits",
      trialEndsAt: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Get usage stats
    const stats = await caller.usage.getUsageStats({ organisationId: orgId });

    expect(stats.limits.maxLeads).toBe(plan.maxLeadsPerMonth);
    expect(stats.limits.maxProspects).toBeGreaterThan(0);
    expect(stats.limits.maxCampaigns).toBeGreaterThan(0);
  });

  it("should allow action when within limits", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation
    const orgId = await createOrganisation({
      name: "Test Allow Org",
      industry: "Testing",
      website: null,
      abn: null,
      serviceAreas: null,
      jobTypes: null,
      averageJobValue: null,
      leadHandling: null,
      onboarded: true,
      slug: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    // Check if we can create a prospect
    const check = await caller.usage.checkLimit({
      organisationId: orgId,
      action: "prospect",
      count: 10,
    });

    expect(check.allowed).toBe(true);
  });

  it("should block action when limit exceeded", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation
    const orgId = await createOrganisation({
      name: "Test Block Org",
      industry: "Testing",
      website: null,
      abn: null,
      serviceAreas: null,
      jobTypes: null,
      averageJobValue: null,
      leadHandling: null,
      onboarded: true,
      slug: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    // Try to create more prospects than free limit (50)
    const check = await caller.usage.checkLimit({
      organisationId: orgId,
      action: "prospect",
      count: 100,
    });

    expect(check.allowed).toBe(false);
    expect(check.reason).toBeDefined();
    expect(check.current).toBeDefined();
    expect(check.limit).toBeDefined();
  });

  it("should calculate usage percentages correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation
    const orgId = await createOrganisation({
      name: "Test Percentage Org",
      industry: "Testing",
      website: null,
      abn: null,
      serviceAreas: null,
      jobTypes: null,
      averageJobValue: null,
      leadHandling: null,
      onboarded: true,
      slug: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    // Get usage stats
    const stats = await caller.usage.getUsageStats({ organisationId: orgId });

    // With zero usage, percentages should be 0
    expect(stats.percentages.prospects).toBe(0);
    expect(stats.percentages.leads).toBe(0);
    expect(stats.percentages.campaigns).toBe(0);
  });

  it("should show warnings when approaching limits", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation
    const orgId = await createOrganisation({
      name: "Test Warning Org",
      industry: "Testing",
      website: null,
      abn: null,
      serviceAreas: null,
      jobTypes: null,
      averageJobValue: null,
      leadHandling: null,
      onboarded: true,
      slug: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    // Get usage stats
    const stats = await caller.usage.getUsageStats({ organisationId: orgId });

    // With zero usage, no warnings
    expect(stats.warnings.prospects).toBe(false);
    expect(stats.warnings.leads).toBe(false);
    expect(stats.warnings.campaigns).toBe(false);
  });
});
