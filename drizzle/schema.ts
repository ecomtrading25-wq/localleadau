import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with role and onboarding status.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
  onboarded: boolean("onboarded").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organisation (multi-tenant)
 * Each customer business is an organisation
 */
export const organisations = mysqlTable("organisations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  abn: varchar("abn", { length: 20 }),
  
  // Service areas
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  radius: int("radius"), // in km
  suburbs: text("suburbs"), // JSON array of suburb names
  
  // Business metrics
  averageJobValue: int("averageJobValue"), // in cents
  closeRate: int("closeRate"), // percentage (0-100)
  monthlyFee: int("monthlyFee"), // in cents
  
  // Settings
  leadHandlingEmail: varchar("leadHandlingEmail", { length: 320 }),
  leadHandlingSms: varchar("leadHandlingSms", { length: 20 }),
  
  // Agency relationship
  agencyId: int("agencyId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agencyIdx: index("agency_idx").on(table.agencyId),
}));

export type Organisation = typeof organisations.$inferSelect;
export type InsertOrganisation = typeof organisations.$inferInsert;

/**
 * User-Organisation relationship (many-to-many)
 * Users can belong to multiple organisations
 */
export const userOrganisations = mysqlTable("user_organisations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organisationId: int("organisationId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  orgIdx: index("org_idx").on(table.organisationId),
}));

export type UserOrganisation = typeof userOrganisations.$inferSelect;
export type InsertUserOrganisation = typeof userOrganisations.$inferInsert;

/**
 * Agency (for white-label/multi-tenant)
 */
export const agencies = mysqlTable("agencies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 7 }), // hex color
  secondaryColor: varchar("secondaryColor", { length: 7 }),
  domain: varchar("domain", { length: 255 }), // custom domain
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = typeof agencies.$inferInsert;

/**
 * Prospect (scraped from Google Maps, not yet a lead)
 */
export const prospects = mysqlTable("prospects", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  
  // Business info
  businessName: varchar("businessName", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  postcode: varchar("postcode", { length: 10 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  
  // Maps data
  placeId: varchar("placeId", { length: 255 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  rating: varchar("rating", { length: 10 }),
  reviewCount: int("reviewCount"),
  category: varchar("category", { length: 255 }),
  
  // Enrichment
  enriched: boolean("enriched").default(false).notNull(),
  enrichedAt: timestamp("enrichedAt"),
  
  // Status
  status: mysqlEnum("status", ["unqualified", "qualified", "excluded", "converted"]).default("unqualified").notNull(),
  
  // Source tracking
  sourceId: int("sourceId"),
  scrapeJobId: int("scrapeJobId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
  statusIdx: index("status_idx").on(table.status),
  sourceIdx: index("source_idx").on(table.sourceId),
}));

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;

/**
 * ProspectSource (where prospects came from)
 */
export const prospectSources = mysqlTable("prospect_sources", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 100 }),
  location: varchar("location", { length: 255 }),
  searchQuery: text("searchQuery"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
}));

export type ProspectSource = typeof prospectSources.$inferSelect;
export type InsertProspectSource = typeof prospectSources.$inferInsert;

/**
 * ScrapeJob (Google Maps scraping jobs)
 */
export const scrapeJobs = mysqlTable("scrape_jobs", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  sourceId: int("sourceId").notNull(),
  
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  
  // Job config
  searchQuery: text("searchQuery").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  maxResults: int("maxResults").default(100).notNull(),
  
  // Results
  prospectsFound: int("prospectsFound").default(0).notNull(),
  prospectsCreated: int("prospectsCreated").default(0).notNull(),
  
  // Timing
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  // Error handling
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
  statusIdx: index("status_idx").on(table.status),
}));

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = typeof scrapeJobs.$inferInsert;

/**
 * ProspectList (saved lists of prospects)
 */
export const prospectLists = mysqlTable("prospect_lists", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  prospectIds: text("prospectIds"), // JSON array of prospect IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
}));

export type ProspectList = typeof prospectLists.$inferSelect;
export type InsertProspectList = typeof prospectLists.$inferInsert;

/**
 * Lead (converted prospect or direct lead)
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  
  // Business info
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  website: varchar("website", { length: 500 }),
  
  // Lead details
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "won", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }), // campaign, manual, prospect, etc.
  sourceId: int("sourceId"), // ID of campaign or prospect
  
  // Value tracking
  estimatedValue: int("estimatedValue"), // in cents
  actualValue: int("actualValue"), // in cents
  
  // Assignment
  assignedToUserId: int("assignedToUserId"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
  statusIdx: index("status_idx").on(table.status),
  assignedIdx: index("assigned_idx").on(table.assignedToUserId),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Interaction (lead activity timeline)
 */
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId"),
  
  type: mysqlEnum("type", ["note", "email", "call", "meeting", "status_change"]).notNull(),
  content: text("content"),
  
  // Metadata
  metadata: text("metadata"), // JSON for additional data
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  leadIdx: index("lead_idx").on(table.leadId),
}));

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

/**
 * Campaign (email/SMS sequences)
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  
  // Template info
  isTemplate: boolean("isTemplate").default(false).notNull(),
  templateCategory: varchar("templateCategory", { length: 100 }),
  
  // Stats
  totalRecipients: int("totalRecipients").default(0).notNull(),
  totalSent: int("totalSent").default(0).notNull(),
  totalOpened: int("totalOpened").default(0).notNull(),
  totalReplied: int("totalReplied").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
  statusIdx: index("status_idx").on(table.status),
  templateIdx: index("template_idx").on(table.isTemplate),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * CampaignStep (individual steps in a campaign sequence)
 */
export const campaignSteps = mysqlTable("campaign_steps", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  
  stepNumber: int("stepNumber").notNull(),
  channel: mysqlEnum("channel", ["email", "sms"]).notNull(),
  
  // Timing
  delayDays: int("delayDays").default(0).notNull(),
  
  // Email content
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  campaignIdx: index("campaign_idx").on(table.campaignId),
}));

export type CampaignStep = typeof campaignSteps.$inferSelect;
export type InsertCampaignStep = typeof campaignSteps.$inferInsert;

/**
 * CampaignRecipient (tracks who's in a campaign)
 */
export const campaignRecipients = mysqlTable("campaign_recipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  prospectId: int("prospectId"),
  leadId: int("leadId"),
  
  status: mysqlEnum("status", ["pending", "active", "completed", "unsubscribed"]).default("pending").notNull(),
  
  currentStep: int("currentStep").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  campaignIdx: index("campaign_idx").on(table.campaignId),
  prospectIdx: index("prospect_idx").on(table.prospectId),
  leadIdx: index("lead_idx").on(table.leadId),
}));

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = typeof campaignRecipients.$inferInsert;

/**
 * BillingPlan (subscription tiers)
 */
export const billingPlans = mysqlTable("billing_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  
  priceMonthly: int("priceMonthly").notNull(), // in cents
  priceAnnual: int("priceAnnual").notNull(), // in cents
  
  // Limits
  maxNiches: int("maxNiches").default(1).notNull(),
  maxRegions: int("maxRegions").default(1).notNull(),
  maxLeadsPerMonth: int("maxLeadsPerMonth").default(15).notNull(),
  
  // Features
  features: text("features"), // JSON array of feature strings
  
  // Stripe
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 255 }),
  stripePriceIdAnnual: varchar("stripePriceIdAnnual", { length: 255 }),
  
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingPlan = typeof billingPlans.$inferSelect;
export type InsertBillingPlan = typeof billingPlans.$inferInsert;

/**
 * Subscription (organisation's billing)
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  planId: int("planId").notNull(),
  
  status: mysqlEnum("status", ["trialing", "active", "past_due", "canceled", "unpaid"]).default("trialing").notNull(),
  
  // Billing period
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "annual"]).default("monthly").notNull(),
  
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  // Dates
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organisationId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Programmatic SEO - Niches
 */
export const pseoNiches = mysqlTable("pseo_niches", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  pluralLabel: varchar("pluralLabel", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // tradies, clinics, home_services
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PseoNiche = typeof pseoNiches.$inferSelect;
export type InsertPseoNiche = typeof pseoNiches.$inferInsert;

/**
 * Programmatic SEO - Locations
 */
export const pseoLocations = mysqlTable("pseo_locations", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  regionLabel: varchar("regionLabel", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PseoLocation = typeof pseoLocations.$inferSelect;
export type InsertPseoLocation = typeof pseoLocations.$inferInsert;

/**
 * Programmatic SEO - Pages
 */
export const pseoPages = mysqlTable("pseo_pages", {
  id: int("id").autoincrement().primaryKey(),
  nicheId: int("nicheId").notNull(),
  locationId: int("locationId").notNull(),
  
  path: varchar("path", { length: 500 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  metaDescription: text("metaDescription"),
  
  // Content overrides (optional, otherwise use templates)
  heroOverride: text("heroOverride"),
  contentOverride: text("contentOverride"),
  
  published: boolean("published").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nicheIdx: index("niche_idx").on(table.nicheId),
  locationIdx: index("location_idx").on(table.locationId),
}));

export type PseoPage = typeof pseoPages.$inferSelect;
export type InsertPseoPage = typeof pseoPages.$inferInsert;

/**
 * Help Articles
 */
export const helpArticles = mysqlTable("help_articles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  body: text("body").notNull(),
  published: boolean("published").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
}));

export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = typeof helpArticles.$inferInsert;

/**
 * Feedback
 */
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  organisationId: int("organisationId"),
  
  type: mysqlEnum("type", ["idea", "bug", "question", "nps"]).notNull(),
  rating: int("rating"), // 0-10 for NPS
  message: text("message"),
  pagePath: varchar("pagePath", { length: 500 }),
  
  status: mysqlEnum("status", ["new", "reviewed", "resolved"]).default("new").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.type),
}));

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userOrganisations: many(userOrganisations),
}));

export const organisationsRelations = relations(organisations, ({ many, one }) => ({
  userOrganisations: many(userOrganisations),
  prospects: many(prospects),
  leads: many(leads),
  campaigns: many(campaigns),
  agency: one(agencies, {
    fields: [organisations.agencyId],
    references: [agencies.id],
  }),
}));

export const userOrganisationsRelations = relations(userOrganisations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganisations.userId],
    references: [users.id],
  }),
  organisation: one(organisations, {
    fields: [userOrganisations.organisationId],
    references: [organisations.id],
  }),
}));

export const prospectsRelations = relations(prospects, ({ one }) => ({
  organisation: one(organisations, {
    fields: [prospects.organisationId],
    references: [organisations.id],
  }),
  source: one(prospectSources, {
    fields: [prospects.sourceId],
    references: [prospectSources.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [leads.organisationId],
    references: [organisations.id],
  }),
  assignedTo: one(users, {
    fields: [leads.assignedToUserId],
    references: [users.id],
  }),
  interactions: many(interactions),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [campaigns.organisationId],
    references: [organisations.id],
  }),
  steps: many(campaignSteps),
  recipients: many(campaignRecipients),
}));

export const campaignStepsRelations = relations(campaignSteps, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignSteps.campaignId],
    references: [campaigns.id],
  }),
}));
