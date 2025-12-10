import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCampaign,
  getCampaignsByOrganisation,
  getCampaignById,
  updateCampaignStatus,
  createCampaignStep,
  getCampaignSteps,
} from "../db";

export const campaignsRouter = router({
  // List all campaigns for an organisation
  list: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      isTemplate: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const campaigns = await getCampaignsByOrganisation(input.organisationId);

      let filtered = campaigns;

      // Filter by status if provided
      if (input.status) {
        filtered = filtered.filter(c => c.status === input.status);
      }

      // Filter by template status if provided
      if (input.isTemplate !== undefined) {
        filtered = filtered.filter(c => c.isTemplate === input.isTemplate);
      }

      return filtered;
    }),

  // Get single campaign details
  get: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input }) => {
      const campaign = await getCampaignById(input.campaignId);
      return campaign;
    }),

  // Create new campaign
  create: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      name: z.string().min(1),
      description: z.string().optional(),
      isTemplate: z.boolean().default(false),
      templateCategory: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const campaignId = await createCampaign({
        organisationId: input.organisationId,
        name: input.name,
        description: input.description || null,
        status: "draft",
        isTemplate: input.isTemplate,
        templateCategory: input.templateCategory || null,
      });

      return {
        success: true,
        campaignId,
      };
    }),

  // Update campaign status
  updateStatus: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      status: z.enum(["draft", "active", "paused", "completed"]),
    }))
    .mutation(async ({ input }) => {
      await updateCampaignStatus(input.campaignId, input.status);
      return { success: true };
    }),

  // Get campaign steps
  getSteps: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input }) => {
      const steps = await getCampaignSteps(input.campaignId);
      return steps;
    }),

  // Add campaign step
  addStep: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      stepNumber: z.number().min(1),
      channel: z.enum(["email", "sms"]),
      subject: z.string().optional(),
      body: z.string().min(1),
      delayDays: z.number().min(0).default(0),
    }))
    .mutation(async ({ input }) => {
      const stepId = await createCampaignStep({
        campaignId: input.campaignId,
        stepNumber: input.stepNumber,
        channel: input.channel,
        subject: input.subject || null,
        body: input.body,
        delayDays: input.delayDays,
      });

      return {
        success: true,
        stepId,
      };
    }),

  // Get campaign recipients
  getRecipients: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
    }))
    .query(async ({ input }) => {
      // TODO: Implement getCampaignRecipients in db.ts
      return [];
    }),

  // Add recipient to campaign
  addRecipient: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      leadId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement addCampaignRecipient in db.ts
      return { success: true };
    }),
});
