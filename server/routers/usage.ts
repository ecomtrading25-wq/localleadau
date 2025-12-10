import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getOrganisationUsage,
  getOrganisationLimits,
  checkUsageLimit,
  getUsagePercentage,
  isApproachingLimit,
  hasExceededLimit,
} from "../usage";

export const usageRouter = router({
  // Get current usage and limits for an organisation
  getUsageStats: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
    }))
    .query(async ({ input }) => {
      const usage = await getOrganisationUsage(input.organisationId);
      const limits = await getOrganisationLimits(input.organisationId);

      return {
        usage,
        limits,
        percentages: {
          prospects: getUsagePercentage(usage.prospects, limits.maxProspects),
          leads: getUsagePercentage(usage.leads, limits.maxLeads),
          campaigns: getUsagePercentage(usage.campaigns, limits.maxCampaigns),
        },
        warnings: {
          prospects: isApproachingLimit(usage.prospects, limits.maxProspects),
          leads: isApproachingLimit(usage.leads, limits.maxLeads),
          campaigns: isApproachingLimit(usage.campaigns, limits.maxCampaigns),
        },
        exceeded: {
          prospects: hasExceededLimit(usage.prospects, limits.maxProspects),
          leads: hasExceededLimit(usage.leads, limits.maxLeads),
          campaigns: hasExceededLimit(usage.campaigns, limits.maxCampaigns),
        },
      };
    }),

  // Check if an action is allowed
  checkLimit: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      action: z.enum(["prospect", "lead", "campaign"]),
      count: z.number().default(1),
    }))
    .query(async ({ input }) => {
      return await checkUsageLimit(input.organisationId, input.action, input.count);
    }),
});
