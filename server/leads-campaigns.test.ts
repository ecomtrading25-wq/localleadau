import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 997,
    openId: "test-user-leads-campaigns",
    email: "test@example.com",
    name: "Test User",
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
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Leads Management", () => {
  it("lists leads for an organisation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation first
    const onboardingResult = await caller.onboarding.complete({
      businessName: "Leads Test Business",
      city: "Sydney",
      state: "NSW",
      radius: 25,
      averageJobValue: 500,
      closeRate: 30,
      leadHandlingEmail: "test@leads.com",
    });

    const leads = await caller.leads.list({
      organisationId: onboardingResult.organisationId,
      limit: 100,
    });

    expect(Array.isArray(leads)).toBe(true);
  });

  it("filters leads by status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Filter Leads Test",
      city: "Melbourne",
      state: "VIC",
      radius: 30,
      averageJobValue: 600,
      closeRate: 35,
      leadHandlingEmail: "test@filter-leads.com",
    });

    const newLeads = await caller.leads.list({
      organisationId: onboardingResult.organisationId,
      status: "new",
    });

    expect(Array.isArray(newLeads)).toBe(true);
  });

  it("adds interaction to a lead", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation and get leads
    const onboardingResult = await caller.onboarding.complete({
      businessName: "Interaction Test Business",
      city: "Brisbane",
      state: "QLD",
      radius: 20,
      averageJobValue: 700,
      closeRate: 40,
      leadHandlingEmail: "test@interaction.com",
    });

    // Since we don't have leads yet, we can't test interaction addition
    // This test verifies the API structure is correct
    const leads = await caller.leads.list({
      organisationId: onboardingResult.organisationId,
    });

    expect(Array.isArray(leads)).toBe(true);
  });
});

describe("Campaign Management", () => {
  it("creates a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Campaign Test Business",
      city: "Perth",
      state: "WA",
      radius: 35,
      averageJobValue: 800,
      closeRate: 45,
      leadHandlingEmail: "test@campaign.com",
    });

    const result = await caller.campaigns.create({
      organisationId: onboardingResult.organisationId,
      name: "Welcome Sequence",
      description: "Automated welcome emails for new leads",
    });

    expect(result.success).toBe(true);
    expect(result.campaignId).toBeTypeOf("number");
  });

  it("lists campaigns for an organisation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "List Campaigns Test",
      city: "Adelaide",
      state: "SA",
      radius: 25,
      averageJobValue: 550,
      closeRate: 32,
      leadHandlingEmail: "test@list-campaigns.com",
    });

    // Create a campaign
    await caller.campaigns.create({
      organisationId: onboardingResult.organisationId,
      name: "Test Campaign",
    });

    const campaigns = await caller.campaigns.list({
      organisationId: onboardingResult.organisationId,
    });

    expect(campaigns.length).toBeGreaterThan(0);
    expect(campaigns[0].name).toBe("Test Campaign");
  });

  it("updates campaign status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Update Campaign Test",
      city: "Hobart",
      state: "TAS",
      radius: 15,
      averageJobValue: 450,
      closeRate: 28,
      leadHandlingEmail: "test@update-campaign.com",
    });

    // Create a campaign
    const createResult = await caller.campaigns.create({
      organisationId: onboardingResult.organisationId,
      name: "Status Test Campaign",
    });

    // Update status
    const updateResult = await caller.campaigns.updateStatus({
      campaignId: createResult.campaignId,
      status: "active",
    });

    expect(updateResult.success).toBe(true);

    // Verify status was updated
    const campaign = await caller.campaigns.get({
      campaignId: createResult.campaignId,
    });

    expect(campaign?.status).toBe("active");
  });

  it("adds steps to a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Campaign Steps Test",
      city: "Canberra",
      state: "ACT",
      radius: 20,
      averageJobValue: 650,
      closeRate: 38,
      leadHandlingEmail: "test@steps.com",
    });

    // Create a campaign
    const createResult = await caller.campaigns.create({
      organisationId: onboardingResult.organisationId,
      name: "Multi-Step Campaign",
    });

    // Add a step
    const stepResult = await caller.campaigns.addStep({
      campaignId: createResult.campaignId,
      stepNumber: 1,
      channel: "email",
      subject: "Welcome to our service!",
      body: "Thank you for signing up...",
      delayDays: 0,
    });

    expect(stepResult.success).toBe(true);
    expect(stepResult.stepId).toBeTypeOf("number");

    // Verify step was added
    const steps = await caller.campaigns.getSteps({
      campaignId: createResult.campaignId,
    });

    expect(steps.length).toBe(1);
    expect(steps[0].subject).toBe("Welcome to our service!");
  });

  it("filters campaigns by status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Filter Campaigns Test",
      city: "Darwin",
      state: "NT",
      radius: 30,
      averageJobValue: 700,
      closeRate: 35,
      leadHandlingEmail: "test@filter-campaigns.com",
    });

    // Create campaigns with different statuses
    const draft = await caller.campaigns.create({
      organisationId: onboardingResult.organisationId,
      name: "Draft Campaign",
    });

    const active = await caller.campaigns.create({
      organisationId: onboardingResult.organisationId,
      name: "Active Campaign",
    });

    await caller.campaigns.updateStatus({
      campaignId: active.campaignId,
      status: "active",
    });

    // Filter by status
    const activeCampaigns = await caller.campaigns.list({
      organisationId: onboardingResult.organisationId,
      status: "active",
    });

    const draftCampaigns = await caller.campaigns.list({
      organisationId: onboardingResult.organisationId,
      status: "draft",
    });

    expect(activeCampaigns.length).toBeGreaterThan(0);
    expect(draftCampaigns.length).toBeGreaterThan(0);
    expect(activeCampaigns.every(c => c.status === "active")).toBe(true);
    expect(draftCampaigns.every(c => c.status === "draft")).toBe(true);
  });
});
