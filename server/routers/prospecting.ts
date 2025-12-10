import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createProspectSource,
  createScrapeJob,
  getScrapeJobById,
  updateScrapeJobStatus,
  createProspect,
  getProspectsByOrganisation,
  getProspectById,
  updateProspectStatus,
  getProspectSourcesByOrganisation,
  createLead,
} from "../db";
import { makeRequest } from "../_core/map";
import { TRPCError } from "@trpc/server";
import { checkUsageLimit } from "../usage";

export const prospectingRouter = router({
  // Create a new scrape job
  createScrapeJob: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      searchQuery: z.string().min(1),
      location: z.string().min(1),
      maxResults: z.number().min(1).max(500).default(100),
      sourceName: z.string().optional(),
      niche: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check usage limits before creating scrape job
      const limitCheck = await checkUsageLimit(input.organisationId, "prospect", input.maxResults);
      
      if (!limitCheck.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: limitCheck.reason || "Prospect limit exceeded. Please upgrade your plan.",
        });
      }

      // Create prospect source
      const sourceId = await createProspectSource({
        organisationId: input.organisationId,
        name: input.sourceName || `${input.searchQuery} in ${input.location}`,
        niche: input.niche || null,
        location: input.location,
        searchQuery: input.searchQuery,
      });

      // Create scrape job
      const jobId = await createScrapeJob({
        organisationId: input.organisationId,
        sourceId,
        status: "pending",
        searchQuery: input.searchQuery,
        location: input.location,
        maxResults: input.maxResults,
        prospectsFound: 0,
        prospectsCreated: 0,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
      });

      // Start the scraping process asynchronously
      processScrapeJob(jobId).catch(err => {
        console.error(`[Scrape Job ${jobId}] Failed:`, err);
      });

      return {
        success: true,
        jobId,
        sourceId,
      };
    }),

  // Get scrape job status
  getScrapeJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.number(),
    }))
    .query(async ({ input }) => {
      const job = await getScrapeJobById(input.jobId);
      return job;
    }),

  // List all prospects for an organisation
  listProspects: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
      status: z.enum(["unqualified", "qualified", "excluded", "converted"]).optional(),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const prospects = await getProspectsByOrganisation(
        input.organisationId,
        input.limit,
        input.offset
      );

      // Filter by status if provided
      if (input.status) {
        return prospects.filter(p => p.status === input.status);
      }

      return prospects;
    }),

  // Get single prospect details
  getProspect: protectedProcedure
    .input(z.object({
      prospectId: z.number(),
    }))
    .query(async ({ input }) => {
      const prospect = await getProspectById(input.prospectId);
      return prospect;
    }),

  // Update prospect status
  updateProspectStatus: protectedProcedure
    .input(z.object({
      prospectId: z.number(),
      status: z.enum(["unqualified", "qualified", "excluded", "converted"]),
    }))
    .mutation(async ({ input }) => {
      await updateProspectStatus(input.prospectId, input.status);
      return { success: true };
    }),

  // Convert prospect to lead
  convertToLead: protectedProcedure
    .input(z.object({
      prospectId: z.number(),
      organisationId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check lead limit before converting
      const limitCheck = await checkUsageLimit(input.organisationId, "lead", 1);
      
      if (!limitCheck.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: limitCheck.reason || "Monthly lead limit exceeded. Please upgrade your plan.",
        });
      }

      const prospect = await getProspectById(input.prospectId);
      if (!prospect) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prospect not found",
        });
      }

      // Create lead from prospect
      const leadId = await createLead({
        organisationId: input.organisationId,
        businessName: prospect.businessName,
        contactName: null,
        email: prospect.email || null,
        phone: prospect.phone || null,
        address: prospect.address || null,
        website: prospect.website || null,
        status: "new",
        source: "prospect",
        sourceId: prospect.id,
        estimatedValue: null,
        actualValue: null,
        assignedToUserId: null,
        notes: input.notes || null,
      });

      // Mark prospect as converted
      await updateProspectStatus(input.prospectId, "converted");

      return {
        success: true,
        leadId,
      };
    }),

  // List prospect sources
  listSources: protectedProcedure
    .input(z.object({
      organisationId: z.number(),
    }))
    .query(async ({ input }) => {
      const sources = await getProspectSourcesByOrganisation(input.organisationId);
      return sources;
    }),
});

/**
 * Process a scrape job by calling Google Maps API
 */
async function processScrapeJob(jobId: number) {
  try {
    // Update job status to running
    await updateScrapeJobStatus(jobId, "running", {
      startedAt: new Date(),
    });

    const job = await getScrapeJobById(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    // Call Google Maps Places API via the Manus proxy
    // Using Text Search to find businesses
    const response = await makeRequest<{
      results: Array<{
        place_id: string;
        name: string;
        formatted_address?: string;
      }>;
      status: string;
    }>(
      "/maps/api/place/textsearch/json",
      {
        query: `${job.searchQuery} in ${job.location}`,
        type: "establishment",
      }
    );

    if (!response.results || !Array.isArray(response.results)) {
      throw new Error("Invalid response from Google Maps API");
    }

    const results = response.results.slice(0, job.maxResults);
    let prospectsCreated = 0;

    // Process each result
    for (const place of results) {
      try {
        // Get additional details for each place
        const detailsResponse = await makeRequest<{
          result: {
            name?: string;
            formatted_address?: string;
            formatted_phone_number?: string;
            website?: string;
            geometry?: {
              location?: {
                lat?: number;
                lng?: number;
              };
            };
            rating?: number;
            user_ratings_total?: number;
            types?: string[];
          };
          status: string;
        }>(
          "/maps/api/place/details/json",
          {
            place_id: place.place_id,
            fields: "name,formatted_address,formatted_phone_number,website,geometry,rating,user_ratings_total,types",
          }
        );

        const details = detailsResponse.result;
        if (!details) continue;

        // Extract address components
        const addressParts = details.formatted_address?.split(", ") || [];
        const postcode = addressParts[addressParts.length - 2]?.match(/\d{4}/)?.[0];
        const state = addressParts[addressParts.length - 2]?.replace(/\d{4}/, "").trim();
        const city = addressParts[addressParts.length - 3];

        // Create prospect
        await createProspect({
          organisationId: job.organisationId,
          businessName: details.name || "Unknown Business",
          address: details.formatted_address || null,
          city: city || null,
          state: state || null,
          postcode: postcode || null,
          phone: details.formatted_phone_number || null,
          email: null, // Not provided by Google Maps API
          website: details.website || null,
          placeId: place.place_id,
          latitude: details.geometry?.location?.lat?.toString() || null,
          longitude: details.geometry?.location?.lng?.toString() || null,
          rating: details.rating?.toString() || null,
          reviewCount: details.user_ratings_total || null,
          category: details.types?.[0] || null,
          enriched: false,
          enrichedAt: null,
          status: "unqualified",
          sourceId: job.sourceId,
          scrapeJobId: jobId,
        });

        prospectsCreated++;
      } catch (err) {
        console.error(`[Scrape Job ${jobId}] Failed to process place:`, err);
        // Continue with next place
      }
    }

    // Update job status to completed
    await updateScrapeJobStatus(jobId, "completed", {
      completedAt: new Date(),
      prospectsFound: results.length,
      prospectsCreated,
    });

  } catch (error) {
    console.error(`[Scrape Job ${jobId}] Error:`, error);
    await updateScrapeJobStatus(jobId, "failed", {
      completedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
