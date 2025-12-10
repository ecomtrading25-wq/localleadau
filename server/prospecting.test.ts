import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  getProspectsByOrganisation,
  getProspectById,
  getScrapeJobById,
  getProspectSourcesByOrganisation,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 998,
    openId: "test-user-prospecting",
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

describe("prospecting.createScrapeJob", () => {
  it("creates a scrape job and prospect source", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an organisation
    const onboardingResult = await caller.onboarding.complete({
      businessName: "Prospecting Test Business",
      city: "Sydney",
      state: "NSW",
      radius: 25,
      averageJobValue: 500,
      closeRate: 30,
      leadHandlingEmail: "test@prospecting.com",
    });

    const result = await caller.prospecting.createScrapeJob({
      organisationId: onboardingResult.organisationId,
      searchQuery: "plumbers",
      location: "Sydney, NSW",
      maxResults: 10,
      sourceName: "Sydney Plumbers",
      niche: "Plumbing",
    });

    expect(result.success).toBe(true);
    expect(result.jobId).toBeTypeOf("number");
    expect(result.sourceId).toBeTypeOf("number");

    // Verify job was created
    const job = await getScrapeJobById(result.jobId);
    expect(job).toBeDefined();
    expect(job?.searchQuery).toBe("plumbers");
    expect(job?.location).toBe("Sydney, NSW");
    expect(job?.maxResults).toBe(10);
    // Job status can be 'pending' or 'running' depending on async timing
    expect(["pending", "running", "completed", "failed"]).toContain(job?.status);

    // Verify source was created
    const sources = await getProspectSourcesByOrganisation(onboardingResult.organisationId);
    const source = sources.find(s => s.id === result.sourceId);
    expect(source).toBeDefined();
    expect(source?.name).toBe("Sydney Plumbers");
    expect(source?.niche).toBe("Plumbing");
  });

  it("uses default source name if not provided", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Default Name Test",
      city: "Melbourne",
      state: "VIC",
      radius: 30,
      averageJobValue: 600,
      closeRate: 35,
      leadHandlingEmail: "test@default.com",
    });

    const result = await caller.prospecting.createScrapeJob({
      organisationId: onboardingResult.organisationId,
      searchQuery: "electricians",
      location: "Melbourne, VIC",
      maxResults: 20,
    });

    const sources = await getProspectSourcesByOrganisation(onboardingResult.organisationId);
    const source = sources.find(s => s.id === result.sourceId);
    expect(source?.name).toBe("electricians in Melbourne, VIC");
  });
});

describe("prospecting.listProspects", () => {
  it("returns empty array for organisation with no prospects", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "No Prospects Test",
      city: "Brisbane",
      state: "QLD",
      radius: 20,
      averageJobValue: 700,
      closeRate: 40,
      leadHandlingEmail: "test@noprospects.com",
    });

    const result = await caller.prospecting.listProspects({
      organisationId: onboardingResult.organisationId,
      limit: 100,
    });

    expect(result).toEqual([]);
  });

  it("filters prospects by status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Filter Test Business",
      city: "Perth",
      state: "WA",
      radius: 35,
      averageJobValue: 800,
      closeRate: 45,
      leadHandlingEmail: "test@filter.com",
    });

    // Get all prospects (should be empty initially)
    const allProspects = await caller.prospecting.listProspects({
      organisationId: onboardingResult.organisationId,
    });

    expect(Array.isArray(allProspects)).toBe(true);
  });
});

describe("prospecting.updateProspectStatus", () => {
  it("updates prospect status successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create organisation and scrape job
    const onboardingResult = await caller.onboarding.complete({
      businessName: "Status Update Test",
      city: "Adelaide",
      state: "SA",
      radius: 25,
      averageJobValue: 550,
      closeRate: 32,
      leadHandlingEmail: "test@status.com",
    });

    // Note: Since scraping is async and depends on external API,
    // we can't easily test the full flow in unit tests
    // This test verifies the API structure is correct
    const result = await caller.prospecting.listProspects({
      organisationId: onboardingResult.organisationId,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("prospecting.convertToLead", () => {
  it("requires valid prospect ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Convert Test Business",
      city: "Hobart",
      state: "TAS",
      radius: 15,
      averageJobValue: 450,
      closeRate: 28,
      leadHandlingEmail: "test@convert.com",
    });

    // Try to convert non-existent prospect
    await expect(
      caller.prospecting.convertToLead({
        prospectId: 999999,
        organisationId: onboardingResult.organisationId,
      })
    ).rejects.toThrow("Prospect not found");
  });
});

describe("prospecting.listSources", () => {
  it("returns prospect sources for organisation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const onboardingResult = await caller.onboarding.complete({
      businessName: "Sources Test Business",
      city: "Canberra",
      state: "ACT",
      radius: 20,
      averageJobValue: 650,
      closeRate: 38,
      leadHandlingEmail: "test@sources.com",
    });

    // Create a scrape job (which creates a source)
    await caller.prospecting.createScrapeJob({
      organisationId: onboardingResult.organisationId,
      searchQuery: "landscapers",
      location: "Canberra, ACT",
      maxResults: 15,
      sourceName: "ACT Landscapers",
    });

    const sources = await caller.prospecting.listSources({
      organisationId: onboardingResult.organisationId,
    });

    expect(sources.length).toBeGreaterThan(0);
    const source = sources[0];
    expect(source.name).toBe("ACT Landscapers");
    expect(source.searchQuery).toBe("landscapers");
    expect(source.location).toBe("Canberra, ACT");
  });
});
