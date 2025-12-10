import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `admin-user-${userId}`,
    email: `admin${userId}@example.com`,
    name: `Admin User ${userId}`,
    loginMethod: "manus",
    role: "admin",
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

function createUserContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `regular-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Regular User ${userId}`,
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

describe("Help Center", () => {
  it("should return list of categories", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.help.categories();

    expect(categories).toBeDefined();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("value");
    expect(categories[0]).toHaveProperty("label");
  });

  it("should allow admin to create help article", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.help.create({
      title: "Test Article",
      slug: `test-article-${Date.now()}`,
      body: "This is a test article body with some **markdown** content.",
      category: "getting-started",
      published: true,
    });

    expect(result.success).toBe(true);
    expect(result.articleId).toBeDefined();
    expect(typeof result.articleId).toBe("number");
  });

  it("should prevent non-admin from creating help article", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.help.create({
        title: "Test Article",
        slug: `test-article-${Date.now()}`,
        body: "This is a test article body.",
        category: "getting-started",
        published: true,
      })
    ).rejects.toThrow("Only admins can create help articles");
  });

  it("should list published articles for public", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a published article
    await caller.help.create({
      title: "Published Article",
      slug: `published-article-${Date.now()}`,
      body: "This is a published article.",
      category: "features",
      published: true,
    });

    // List articles (default is published only)
    const articles = await caller.help.list();

    expect(articles).toBeDefined();
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.every(a => a.published)).toBe(true);
  });

  it("should get article by slug", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const slug = `test-slug-${Date.now()}`;
    
    // Create article
    await caller.help.create({
      title: "Test Article for Slug",
      slug,
      body: "This is a test article.",
      category: "troubleshooting",
      published: true,
    });

    // Get article by slug
    const article = await caller.help.getBySlug({ slug });

    expect(article).toBeDefined();
    expect(article.slug).toBe(slug);
    expect(article.title).toBe("Test Article for Slug");
  });

  it("should search articles by query", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueWord = `searchable${Date.now()}`;
    
    // Create article with unique word
    await caller.help.create({
      title: `Article with ${uniqueWord} in title`,
      slug: `search-test-${Date.now()}`,
      body: "This is a test article.",
      category: "features",
      published: true,
    });

    // Search for the unique word
    const results = await caller.help.search({ query: uniqueWord });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain(uniqueWord);
  });

  it("should allow admin to update article", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create article
    const createResult = await caller.help.create({
      title: "Original Title",
      slug: `update-test-${Date.now()}`,
      body: "Original body.",
      category: "features",
      published: false,
    });

    // Update article
    const updateResult = await caller.help.update({
      id: createResult.articleId,
      title: "Updated Title",
      published: true,
    });

    expect(updateResult.success).toBe(true);

    // Verify update
    const article = await caller.help.getById({ id: createResult.articleId });
    expect(article.title).toBe("Updated Title");
    expect(article.published).toBe(true);
  });

  it("should allow admin to delete article", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create article
    const createResult = await caller.help.create({
      title: "Article to Delete",
      slug: `delete-test-${Date.now()}`,
      body: "This will be deleted.",
      category: "features",
      published: false,
    });

    // Delete article
    const deleteResult = await caller.help.delete({ id: createResult.articleId });

    expect(deleteResult.success).toBe(true);

    // Verify deletion
    await expect(
      caller.help.getById({ id: createResult.articleId })
    ).rejects.toThrow("Article not found");
  });

  it("should filter articles by category", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create article in specific category
    await caller.help.create({
      title: "Billing Article",
      slug: `billing-test-${Date.now()}`,
      body: "This is about billing.",
      category: "billing",
      published: true,
    });

    // List articles in billing category
    const articles = await caller.help.list({ category: "billing" });

    expect(articles).toBeDefined();
    expect(articles.every(a => a.category === "billing")).toBe(true);
  });
});
