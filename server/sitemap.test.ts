import { describe, expect, it } from "vitest";
import { generateSitemap } from "./sitemap";
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

describe("Sitemap Generation", () => {
  it("should generate valid XML sitemap", async () => {
    const sitemap = await generateSitemap("https://example.com");

    expect(sitemap).toBeDefined();
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('</urlset>');
  });

  it("should include published pages in sitemap", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a niche and location
    const nicheResult = await caller.pseo.createNiche({
      slug: `sitemap-test-niche-${Date.now()}`,
      label: "Sitemap Test Niche",
      pluralLabel: "Sitemap Test Niches",
      category: "test",
    });

    const locationResult = await caller.pseo.createLocation({
      slug: `sitemap-test-location-${Date.now()}`,
      city: "Sitemap Test City",
      state: "TEST",
      regionLabel: "Test Region",
    });

    // Generate a page
    await caller.pseo.generatePages({
      nicheId: nicheResult.nicheId,
      locationId: locationResult.locationId,
    });

    // Generate sitemap
    const sitemap = await generateSitemap("https://example.com");

    // Check that the sitemap contains URL elements
    expect(sitemap).toContain('<loc>');
    expect(sitemap).toContain('<lastmod>');
    expect(sitemap).toContain('<changefreq>weekly</changefreq>');
    expect(sitemap).toContain('<priority>0.8</priority>');
  });

  it("should format URLs correctly with base URL", async () => {
    const baseUrl = "https://localleadau.com";
    const sitemap = await generateSitemap(baseUrl);

    // Check that all URLs start with the base URL
    const urlMatches = sitemap.match(/<loc>(.*?)<\/loc>/g);
    if (urlMatches && urlMatches.length > 0) {
      urlMatches.forEach(match => {
        expect(match).toContain(baseUrl);
      });
    }
  });

  it("should include lastmod dates in ISO format", async () => {
    const sitemap = await generateSitemap("https://example.com");

    // Check for ISO date format (YYYY-MM-DD)
    const datePattern = /\d{4}-\d{2}-\d{2}/;
    const lastmodMatches = sitemap.match(/<lastmod>(.*?)<\/lastmod>/g);
    
    if (lastmodMatches && lastmodMatches.length > 0) {
      lastmodMatches.forEach(match => {
        expect(match).toMatch(datePattern);
      });
    }
  });
});
