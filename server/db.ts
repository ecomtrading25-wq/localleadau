import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  organisations, InsertOrganisation,
  userOrganisations, InsertUserOrganisation,
  prospects, InsertProspect,
  prospectSources, InsertProspectSource,
  scrapeJobs, InsertScrapeJob,
  leads, InsertLead,
  interactions, InsertInteraction,
  campaigns, InsertCampaign,
  campaignSteps, InsertCampaignStep,
  campaignRecipients, InsertCampaignRecipient,
  billingPlans, InsertBillingPlan,
  subscriptions, InsertSubscription,
  pseoNiches, InsertPseoNiche,
  pseoLocations, InsertPseoLocation,
  pseoPages, InsertPseoPage,
  helpArticles, InsertHelpArticle,
  feedback, InsertFeedback,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markUserOnboarded(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ onboarded: true }).where(eq(users.id, userId));
}

// ============================================================================
// ORGANISATION MANAGEMENT
// ============================================================================

export async function createOrganisation(org: InsertOrganisation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(organisations).values(org);
  return Number((result as any).insertId);
}

export async function getOrganisationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(organisations).where(eq(organisations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrganisationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(organisations).where(eq(organisations.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrganisation(id: number, updates: Partial<InsertOrganisation>) {
  const db = await getDb();
  if (!db) return;

  await db.update(organisations).set(updates).where(eq(organisations.id, id));
}

export async function getUserOrganisations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      organisation: organisations,
      userOrganisation: userOrganisations,
    })
    .from(userOrganisations)
    .innerJoin(organisations, eq(userOrganisations.organisationId, organisations.id))
    .where(eq(userOrganisations.userId, userId));

  return result;
}

export async function addUserToOrganisation(data: InsertUserOrganisation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(userOrganisations).values(data);
}

// ============================================================================
// PROSPECT MANAGEMENT
// ============================================================================

export async function createProspect(prospect: InsertProspect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(prospects).values(prospect);
  return Number((result as any).insertId);
}

export async function getProspectsByOrganisation(organisationId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(prospects)
    .where(eq(prospects.organisationId, organisationId))
    .orderBy(desc(prospects.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getProspectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProspectStatus(id: number, status: "unqualified" | "qualified" | "excluded" | "converted") {
  const db = await getDb();
  if (!db) return;

  await db.update(prospects).set({ status }).where(eq(prospects.id, id));
}

export async function getProspectsByStatus(organisationId: number, status: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(prospects)
    .where(and(
      eq(prospects.organisationId, organisationId),
      eq(prospects.status, status as any)
    ))
    .orderBy(desc(prospects.createdAt));
}

// ============================================================================
// PROSPECT SOURCE MANAGEMENT
// ============================================================================

export async function createProspectSource(source: InsertProspectSource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(prospectSources).values(source);
  return Number((result as any).insertId);
}

export async function getProspectSourcesByOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(prospectSources)
    .where(eq(prospectSources.organisationId, organisationId))
    .orderBy(desc(prospectSources.createdAt));
}

// ============================================================================
// SCRAPE JOB MANAGEMENT
// ============================================================================

export async function createScrapeJob(job: InsertScrapeJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(scrapeJobs).values(job);
  return Number((result as any).insertId);
}

export async function getScrapeJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(scrapeJobs).where(eq(scrapeJobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateScrapeJobStatus(
  id: number, 
  status: "pending" | "running" | "completed" | "failed",
  updates?: Partial<InsertScrapeJob>
) {
  const db = await getDb();
  if (!db) return;

  await db.update(scrapeJobs).set({ status, ...updates }).where(eq(scrapeJobs.id, id));
}

export async function getPendingScrapeJobs() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(scrapeJobs)
    .where(eq(scrapeJobs.status, "pending"))
    .orderBy(scrapeJobs.createdAt);
}

// ============================================================================
// LEAD MANAGEMENT
// ============================================================================

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(leads).values(lead);
  return Number((result as any).insertId);
}

export async function getLeadsByOrganisation(organisationId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(leads)
    .where(eq(leads.organisationId, organisationId))
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLeadStatus(id: number, status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost") {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

export async function getLeadsByStatus(organisationId: number, status: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(leads)
    .where(and(
      eq(leads.organisationId, organisationId),
      eq(leads.status, status as any)
    ))
    .orderBy(desc(leads.createdAt));
}

export async function assignLead(leadId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ assignedToUserId: userId }).where(eq(leads.id, leadId));
}

// ============================================================================
// INTERACTION MANAGEMENT
// ============================================================================

export async function createInteraction(interaction: InsertInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(interactions).values(interaction);
  return Number((result as any).insertId);
}

export async function getInteractionsByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(interactions)
    .where(eq(interactions.leadId, leadId))
    .orderBy(desc(interactions.createdAt));
}

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(campaigns).values(campaign);
  return Number((result as any).insertId);
}

export async function getCampaignsByOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.organisationId, organisationId))
    .orderBy(desc(campaigns.createdAt));
}

export async function getCampaignTemplates() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.isTemplate, true))
    .orderBy(campaigns.name);
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCampaignStatus(id: number, status: "draft" | "active" | "paused" | "completed") {
  const db = await getDb();
  if (!db) return;

  await db.update(campaigns).set({ status }).where(eq(campaigns.id, id));
}

// ============================================================================
// CAMPAIGN STEP MANAGEMENT
// ============================================================================

export async function createCampaignStep(step: InsertCampaignStep) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(campaignSteps).values(step);
  return Number((result as any).insertId);
}

export async function getCampaignSteps(campaignId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(campaignSteps)
    .where(eq(campaignSteps.campaignId, campaignId))
    .orderBy(campaignSteps.stepNumber);
}

// ============================================================================
// BILLING & SUBSCRIPTION MANAGEMENT
// ============================================================================

export async function getBillingPlans() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.active, true))
    .orderBy(billingPlans.priceMonthly);
}

export async function getBillingPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(billingPlans).where(eq(billingPlans.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(subscriptions).values(subscription);
  return Number((result as any).insertId);
}

export async function getSubscriptionByOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organisationId, organisationId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscriptionStatus(
  id: number, 
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid"
) {
  const db = await getDb();
  if (!db) return;

  await db.update(subscriptions).set({ status }).where(eq(subscriptions.id, id));
}

// ============================================================================
// PSEO MANAGEMENT
// ============================================================================

export async function getPseoNiches() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pseoNiches)
    .where(eq(pseoNiches.active, true))
    .orderBy(pseoNiches.label);
}

export async function getPseoLocations() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pseoLocations)
    .where(eq(pseoLocations.active, true))
    .orderBy(pseoLocations.city);
}

export async function getPseoPageByPath(path: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pseoPages).where(eq(pseoPages.path, path)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPseoPage(page: InsertPseoPage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(pseoPages).values(page);
  return Number((result as any).insertId);
}

// ============================================================================
// HELP & FEEDBACK
// ============================================================================

export async function getHelpArticles(category?: string) {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return await db
      .select()
      .from(helpArticles)
      .where(and(
        eq(helpArticles.published, true),
        eq(helpArticles.category, category)
      ))
      .orderBy(helpArticles.title);
  }

  return await db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.published, true))
    .orderBy(helpArticles.category, helpArticles.title);
}

export async function getHelpArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(helpArticles).where(eq(helpArticles.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createFeedback(feedbackData: InsertFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(feedback).values(feedbackData);
  return Number((result as any).insertId);
}

export async function getFeedbackByOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(feedback)
    .where(eq(feedback.organisationId, organisationId))
    .orderBy(desc(feedback.createdAt));
}

export async function getBillingPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(billingPlans).where(eq(billingPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}
