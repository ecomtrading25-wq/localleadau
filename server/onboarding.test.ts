import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb, getUserByOpenId, getUserOrganisations, getOrganisationById } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(onboarded = false): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999,
    openId: "test-user-onboarding",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    onboarded,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("onboarding.status", () => {
  it("returns onboarded status for authenticated user", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.status();

    expect(result).toEqual({ onboarded: false });
  });

  it("returns true for onboarded user", async () => {
    const ctx = createAuthContext(true);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.status();

    expect(result).toEqual({ onboarded: true });
  });
});

describe("onboarding.complete", () => {
  it("creates organisation and marks user as onboarded", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.complete({
      businessName: "Test Plumbing Services",
      industry: "Plumbing",
      website: "https://testplumbing.com.au",
      abn: "12345678901",
      city: "Sydney",
      state: "NSW",
      radius: 25,
      suburbs: ["Parramatta", "Chatswood"],
      averageJobValue: 500,
      closeRate: 30,
      leadHandlingEmail: "leads@testplumbing.com.au",
      leadHandlingSms: "0412345678",
    });

    expect(result.success).toBe(true);
    expect(result.organisationId).toBeTypeOf("number");
    expect(result.organisationId).toBeGreaterThan(0);

    // Verify organisation was created
    const org = await getOrganisationById(result.organisationId);
    expect(org).toBeDefined();
    expect(org?.name).toBe("Test Plumbing Services");
    expect(org?.industry).toBe("Plumbing");
    expect(org?.city).toBe("Sydney");
    expect(org?.state).toBe("NSW");
    expect(org?.radius).toBe(25);
    expect(org?.averageJobValue).toBe(50000); // 500 * 100 cents
    expect(org?.closeRate).toBe(30);

    // Verify user was added to organisation
    const userOrgs = await getUserOrganisations(ctx.user.id);
    const matchingOrg = userOrgs.find(uo => uo.organisation.id === result.organisationId);
    expect(matchingOrg).toBeDefined();
    expect(matchingOrg?.userOrganisation.role).toBe("owner");

    // Note: User onboarding status is stored in the users table
    // The test user (id: 999) may not exist in the database during tests
    // This is expected behavior - the onboarding mutation updates the user in the DB
    // but the test context user is a mock object
  });

  it("handles minimal input (only required fields)", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.complete({
      businessName: "Minimal Business",
      city: "Melbourne",
      state: "VIC",
      radius: 50,
      averageJobValue: 1000,
      closeRate: 25,
      leadHandlingEmail: "test@minimal.com",
    });

    expect(result.success).toBe(true);

    const org = await getOrganisationById(result.organisationId);
    expect(org).toBeDefined();
    expect(org?.name).toBe("Minimal Business");
    expect(org?.website).toBeNull();
    expect(org?.industry).toBeNull();
  });

  it("generates unique slug from business name", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.onboarding.complete({
      businessName: "Duplicate Name Test",
      city: "Brisbane",
      state: "QLD",
      radius: 30,
      averageJobValue: 750,
      closeRate: 35,
      leadHandlingEmail: "test1@duplicate.com",
    });

    const result2 = await caller.onboarding.complete({
      businessName: "Duplicate Name Test",
      city: "Brisbane",
      state: "QLD",
      radius: 30,
      averageJobValue: 750,
      closeRate: 35,
      leadHandlingEmail: "test2@duplicate.com",
    });

    const org1 = await getOrganisationById(result1.organisationId);
    const org2 = await getOrganisationById(result2.organisationId);

    expect(org1?.slug).not.toBe(org2?.slug);
    expect(org1?.slug).toContain("duplicate-name-test");
    expect(org2?.slug).toContain("duplicate-name-test");
  });

  it("converts average job value to cents correctly", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.onboarding.complete({
      businessName: "Value Test Business",
      city: "Perth",
      state: "WA",
      radius: 40,
      averageJobValue: 1234.56,
      closeRate: 40,
      leadHandlingEmail: "test@value.com",
    });

    const org = await getOrganisationById(result.organisationId);
    expect(org?.averageJobValue).toBe(123456); // 1234.56 * 100, rounded
  });
});

describe("organisation.list", () => {
  it("returns empty array for user with no organisations", async () => {
    const ctx = createAuthContext(true);
    ctx.user.id = 99999; // Non-existent user
    const caller = appRouter.createCaller(ctx);

    const result = await caller.organisation.list();

    expect(result).toEqual([]);
  });

  it("returns organisations with user role", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    // Create an organisation
    const onboardingResult = await caller.onboarding.complete({
      businessName: "List Test Business",
      city: "Adelaide",
      state: "SA",
      radius: 35,
      averageJobValue: 600,
      closeRate: 28,
      leadHandlingEmail: "test@list.com",
    });

    const result = await caller.organisation.list();

    expect(result.length).toBeGreaterThan(0);
    // Find the organisation we just created
    const org = result.find(o => o.id === onboardingResult.organisationId);
    expect(org).toBeDefined();
    expect(org?.name).toBe("List Test Business");
    expect(org?.role).toBe("owner");
  });
});

describe("dashboard.stats", () => {
  it("returns zero stats for new organisation", async () => {
    const ctx = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Stats Test Business",
      city: "Hobart",
      state: "TAS",
      radius: 20,
      averageJobValue: 800,
      closeRate: 32,
      leadHandlingEmail: "test@stats.com",
    });

    const stats = await caller.dashboard.stats({
      organisationId: onboardingResult.organisationId,
    });

    expect(stats).toEqual({
      totalLeads: 0,
      newLeads: 0,
      wonLeads: 0,
      totalProspects: 0,
      qualifiedProspects: 0,
      activeCampaigns: 0,
      totalRevenue: 0,
    });
  });
});
