import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 998,
    openId: "test-user-billing",
    email: "billing@example.com",
    name: "Billing Test User",
    loginMethod: "manus",
    role: "user",
    onboarded: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "https://test.locallead.au",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Billing & Subscriptions", () => {
  it("lists all available billing plans", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.billing.getPlans();

    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThan(0);
    
    // Check plan structure
    const plan = plans[0];
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('slug');
    expect(plan).toHaveProperty('priceMonthly');
    expect(plan).toHaveProperty('priceAnnual');
    expect(plan).toHaveProperty('priceMonthlyFormatted');
    expect(plan).toHaveProperty('priceAnnualFormatted');
    expect(plan).toHaveProperty('featuresArray');
    expect(Array.isArray(plan.featuresArray)).toBe(true);
  });

  it("returns null for organisation with no subscription", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a new organisation
    const onboardingResult = await caller.onboarding.complete({
      businessName: "No Subscription Business",
      city: "Sydney",
      state: "NSW",
      radius: 25,
      averageJobValue: 500,
      closeRate: 30,
      leadHandlingEmail: "test@nosub.com",
    });

    const subscription = await caller.billing.getCurrentSubscription({
      organisationId: onboardingResult.organisationId,
    });

    expect(subscription).toBeNull();
  });

  it("formats prices correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.billing.getPlans();
    const starterPlan = plans.find(p => p.slug === 'starter');

    expect(starterPlan).toBeDefined();
    if (starterPlan) {
      // Price should be formatted as Australian currency
      expect(starterPlan.priceMonthlyFormatted).toContain('$');
      expect(starterPlan.priceMonthlyFormatted).toContain('99');
    }
  });

  it("has correct plan limits", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.billing.getPlans();
    
    const starterPlan = plans.find(p => p.slug === 'starter');
    const enterprisePlan = plans.find(p => p.slug === 'enterprise');

    expect(starterPlan).toBeDefined();
    expect(enterprisePlan).toBeDefined();

    if (starterPlan) {
      // Starter should have limits
      expect(starterPlan.maxNiches).toBeGreaterThan(0);
      expect(starterPlan.maxRegions).toBeGreaterThan(0);
      expect(starterPlan.maxLeadsPerMonth).toBeGreaterThan(0);
    }

    if (enterprisePlan) {
      // Enterprise should have unlimited (-1)
      expect(enterprisePlan.maxNiches).toBe(-1);
      expect(enterprisePlan.maxRegions).toBe(-1);
      expect(enterprisePlan.maxLeadsPerMonth).toBe(-1);
    }
  });

  it("has all three standard plans", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.billing.getPlans();
    const slugs = plans.map(p => p.slug);

    expect(slugs).toContain('starter');
    expect(slugs).toContain('professional');
    expect(slugs).toContain('enterprise');
  });

  it("plans are ordered by price", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.billing.getPlans();

    // Verify plans are in ascending price order
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].priceMonthly).toBeGreaterThanOrEqual(plans[i - 1].priceMonthly);
    }
  });
});
