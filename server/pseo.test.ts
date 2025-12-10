import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("Programmatic SEO", () => {
  it("should create a new niche", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pseo.createNiche({
      slug: `plumber-${Date.now()}`,
      label: "Plumber",
      pluralLabel: "Plumbers",
      category: "tradies",
    });

    expect(result.success).toBe(true);
    expect(result.nicheId).toBeGreaterThan(0);
  });

  it("should list all niches", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a niche first
    await caller.pseo.createNiche({
      slug: `electrician-${Date.now()}`,
      label: "Electrician",
      pluralLabel: "Electricians",
      category: "tradies",
    });

    const niches = await caller.pseo.listNiches();

    expect(Array.isArray(niches)).toBe(true);
    expect(niches.length).toBeGreaterThan(0);
  });

  it("should create a new location", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pseo.createLocation({
      slug: `sydney-${Date.now()}`,
      city: "Sydney",
      state: "NSW",
      regionLabel: "Greater Sydney",
    });

    expect(result.success).toBe(true);
    expect(result.locationId).toBeGreaterThan(0);
  });

  it("should list all locations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a location first
    await caller.pseo.createLocation({
      slug: `melbourne-${Date.now()}`,
      city: "Melbourne",
      state: "VIC",
      regionLabel: "Greater Melbourne",
    });

    const locations = await caller.pseo.listLocations();

    expect(Array.isArray(locations)).toBe(true);
    expect(locations.length).toBeGreaterThan(0);
  });

  it("should generate pages for niche × location combinations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a niche
    const nicheResult = await caller.pseo.createNiche({
      slug: `landscaper-${Date.now()}`,
      label: "Landscaper",
      pluralLabel: "Landscapers",
      category: "tradies",
    });

    // Create a location
    const locationResult = await caller.pseo.createLocation({
      slug: `brisbane-${Date.now()}`,
      city: "Brisbane",
      state: "QLD",
      regionLabel: "Greater Brisbane",
    });

    // Generate pages
    const result = await caller.pseo.generatePages({
      nicheId: nicheResult.nicheId,
      locationId: locationResult.locationId,
    });

    expect(result.success).toBe(true);
    expect(result.pagesCreated).toBe(1);
    expect(result.totalNiches).toBe(1);
    expect(result.totalLocations).toBe(1);
  });

  it("should get page statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.pseo.getStats();

    expect(stats).toBeDefined();
    expect(stats.totalPages).toBeGreaterThanOrEqual(0);
    expect(stats.totalNiches).toBeGreaterThanOrEqual(0);
    expect(stats.totalLocations).toBeGreaterThanOrEqual(0);
    expect(stats.potentialPages).toBe(stats.totalNiches * stats.totalLocations);
  });

  it("should retrieve a page by slug", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a niche and location
    const nicheResult = await caller.pseo.createNiche({
      slug: `carpenter-${Date.now()}`,
      label: "Carpenter",
      pluralLabel: "Carpenters",
      category: "tradies",
    });

    const locationResult = await caller.pseo.createLocation({
      slug: `perth-${Date.now()}`,
      city: "Perth",
      state: "WA",
      regionLabel: "Greater Perth",
    });

    // Generate the page
    await caller.pseo.generatePages({
      nicheId: nicheResult.nicheId,
      locationId: locationResult.locationId,
    });

    // Get the niche and location to build the slug
    const niches = await caller.pseo.listNiches();
    const locations = await caller.pseo.listLocations();
    const niche = niches.find(n => n.id === nicheResult.nicheId);
    const location = locations.find(l => l.id === locationResult.locationId);

    if (!niche || !location) {
      throw new Error("Niche or location not found");
    }

    const slug = `${niche.slug}-${location.slug}`;

    // Retrieve the page
    const page = await caller.pseo.getPageBySlug({ slug });

    expect(page).toBeDefined();
    expect(page?.nicheId).toBe(nicheResult.nicheId);
    expect(page?.locationId).toBe(locationResult.locationId);
  });

  it("should skip existing pages when regenerate is false", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a niche and location
    const nicheResult = await caller.pseo.createNiche({
      slug: `painter-${Date.now()}`,
      label: "Painter",
      pluralLabel: "Painters",
      category: "tradies",
    });

    const locationResult = await caller.pseo.createLocation({
      slug: `adelaide-${Date.now()}`,
      city: "Adelaide",
      state: "SA",
      regionLabel: "Greater Adelaide",
    });

    // Generate pages first time
    const firstResult = await caller.pseo.generatePages({
      nicheId: nicheResult.nicheId,
      locationId: locationResult.locationId,
    });

    expect(firstResult.pagesCreated).toBe(1);

    // Try to generate again without regenerate flag
    const secondResult = await caller.pseo.generatePages({
      nicheId: nicheResult.nicheId,
      locationId: locationResult.locationId,
      regenerate: false,
    });

    expect(secondResult.pagesCreated).toBe(0);
    expect(secondResult.pagesSkipped).toBe(1);
  });
});
