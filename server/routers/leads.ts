import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getLeadsByOrganisation,
  getLeadById,
  updateLeadStatus,
  assignLead,
  createInteraction,
  getInteractionsByLead,
} from "../db";

export const leadsRouter = router({
  // List all leads for an organisation
  list: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const leads = await getLeadsByOrganisation(
        input.organisationId,
        input.limit,
        input.offset
      );

      // Filter by status if provided
      if (input.status) {
        return leads.filter(l => l.status === input.status);
      }

      return leads;
    }),

  // Get single lead details
  get: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      return lead;
    }),

  // Update lead status
  updateStatus: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await updateLeadStatus(input.leadId, input.status);

      // Create interaction for status change
      await createInteraction({
        leadId: input.leadId,
        type: "status_change",
        content: `Status changed to ${input.status}`,
        userId: ctx.user.id,
      });

      return { success: true };
    }),

  // Assign lead to user
  assign: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await assignLead(input.leadId, input.userId);
      return { success: true };
    }),

  // Get lead interactions (activity timeline)
  getInteractions: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      const interactions = await getInteractionsByLead(input.leadId);
      return interactions;
    }),

  // Add interaction (note, email, call, etc.)
  addInteraction: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      type: z.enum(["note", "email", "call", "meeting", "status_change"]),
      content: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const interactionId = await createInteraction({
        leadId: input.leadId,
        type: input.type,
        content: input.content || null,
        userId: ctx.user.id,
      });

      return {
        success: true,
        interactionId,
      };
    }),
});
