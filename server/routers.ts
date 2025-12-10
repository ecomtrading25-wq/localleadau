import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createOrganisation,
  addUserToOrganisation,
  markUserOnboarded,
  getUserOrganisations,
  getOrganisationById,
  updateOrganisation,
  getLeadsByOrganisation,
  getProspectsByOrganisation,
  getCampaignsByOrganisation,
} from "./db";
import { prospectingRouter } from "./routers/prospecting";
import { leadsRouter } from "./routers/leads";
import { campaignsRouter } from "./routers/campaigns";
import { billingRouter } from "./routers/billing";
import { usageRouter } from "./routers/usage";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  onboarding: router({
    complete: protectedProcedure
      .input(z.object({
        // Step 1: About your business
        businessName: z.string().min(1),
        industry: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        abn: z.string().optional(),
        
        // Step 2: Service areas
        city: z.string().min(1),
        state: z.string().min(1),
        radius: z.number().min(1).max(500),
        suburbs: z.array(z.string()).optional(),
        
        // Step 3: Job types and value
        averageJobValue: z.number().min(0),
        closeRate: z.number().min(0).max(100),
        
        // Step 4: Lead handling
        leadHandlingEmail: z.string().email().optional().or(z.literal("")),
        leadHandlingSms: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        
        // Create organisation slug from business name
        const slug = input.businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          + '-' + Date.now();
        
        // Create the organisation
        const orgId = await createOrganisation({
          name: input.businessName,
          slug,
          website: input.website || null,
          industry: input.industry || null,
          abn: input.abn || null,
          city: input.city,
          state: input.state,
          radius: input.radius,
          suburbs: input.suburbs ? JSON.stringify(input.suburbs) : null,
          averageJobValue: Math.round(input.averageJobValue * 100), // Convert to cents
          closeRate: input.closeRate,
          leadHandlingEmail: input.leadHandlingEmail || null,
          leadHandlingSms: input.leadHandlingSms || null,
          agencyId: null,
        });
        
        // Add user as owner of the organisation
        await addUserToOrganisation({
          userId: user.id,
          organisationId: orgId,
          role: 'owner',
        });
        
        // Mark user as onboarded
        await markUserOnboarded(user.id);
        
        return {
          success: true,
          organisationId: orgId,
        };
      }),
    
    status: protectedProcedure.query(async ({ ctx }) => {
      return {
        onboarded: ctx.user.onboarded,
      };
    }),
  }),

  organisation: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const orgs = await getUserOrganisations(ctx.user.id);
      return orgs.map(o => ({
        ...o.organisation,
        role: o.userOrganisation.role,
      }));
    }),
    
    current: protectedProcedure
      .input(z.object({
        organisationId: z.number(),
      }))
      .query(async ({ input }) => {
        const org = await getOrganisationById(input.organisationId);
        if (!org) {
          throw new Error("Organisation not found");
        }
        return org;
      }),
    
    update: protectedProcedure
      .input(z.object({
        organisationId: z.number(),
        updates: z.object({
          name: z.string().optional(),
          website: z.string().optional(),
          industry: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          radius: z.number().optional(),
          averageJobValue: z.number().optional(),
          closeRate: z.number().optional(),
          leadHandlingEmail: z.string().optional(),
          leadHandlingSms: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const updates: any = { ...input.updates };
        
        // Convert averageJobValue to cents if provided
        if (updates.averageJobValue !== undefined) {
          updates.averageJobValue = Math.round(updates.averageJobValue * 100);
        }
        
        await updateOrganisation(input.organisationId, updates);
        
        return { success: true };
      }),
  }),

  dashboard: router({
    stats: protectedProcedure
      .input(z.object({
        organisationId: z.number(),
      }))
      .query(async ({ input }) => {
        const leads = await getLeadsByOrganisation(input.organisationId, 1000);
        const prospects = await getProspectsByOrganisation(input.organisationId, 1000);
        const campaigns = await getCampaignsByOrganisation(input.organisationId);
        
        // Calculate stats
        const totalLeads = leads.length;
        const newLeads = leads.filter(l => l.status === 'new').length;
        const wonLeads = leads.filter(l => l.status === 'won').length;
        const totalProspects = prospects.length;
        const qualifiedProspects = prospects.filter(p => p.status === 'qualified').length;
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        
        // Calculate revenue
        const totalRevenue = leads
          .filter(l => l.status === 'won' && l.actualValue)
          .reduce((sum, l) => sum + (l.actualValue || 0), 0);
        
        return {
          totalLeads,
          newLeads,
          wonLeads,
          totalProspects,
          qualifiedProspects,
          activeCampaigns,
          totalRevenue: totalRevenue / 100, // Convert from cents to dollars
        };
      }),
  }),

  // Prospecting features
  prospecting: prospectingRouter,

  // Lead management
  leads: leadsRouter,

  // Campaign management
  campaigns: campaignsRouter,

  // Billing & subscriptions
  billing: billingRouter,

  // Usage tracking
  usage: usageRouter,
});

export type AppRouter = typeof appRouter;
