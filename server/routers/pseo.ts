import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createPseoNiche,
  getPseoNiches,
  createPseoLocation,
  getPseoLocations,
  createPseoPage,
  getPseoPages,
  getPseoPageBySlug,
  updatePseoPageContent,
} from "../db";
import type { PseoNiche, PseoLocation } from "../../drizzle/schema";

export const pseoRouter = router({
  // ===== Niche Management =====
  
  // List all niches
  listNiches: protectedProcedure.query(async () => {
    return await getPseoNiches();
  }),

  // Create new niche
  createNiche: protectedProcedure
    .input(z.object({
      slug: z.string().min(1),
      label: z.string().min(1),
      pluralLabel: z.string().min(1),
      category: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const nicheId = await createPseoNiche({
        slug: input.slug,
        label: input.label,
        pluralLabel: input.pluralLabel,
        category: input.category || null,
        active: true,
      });

      return {
        success: true,
        nicheId,
      };
    }),

  // ===== Location Management =====
  
  // List all locations
  listLocations: protectedProcedure.query(async () => {
    return await getPseoLocations();
  }),

  // Create new location
  createLocation: protectedProcedure
    .input(z.object({
      slug: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      regionLabel: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const locationId = await createPseoLocation({
        slug: input.slug,
        city: input.city,
        state: input.state,
        regionLabel: input.regionLabel,
        active: true,
      });

      return {
        success: true,
        locationId,
      };
    }),

  // ===== Page Management =====
  
  // List all pages
  listPages: protectedProcedure
    .input(z.object({
      nicheId: z.number().optional(),
      locationId: z.number().optional(),
      published: z.boolean().optional(),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const pages = await getPseoPages(input.limit, input.offset);

      let filtered = pages;

      // Filter by niche if provided
      if (input.nicheId) {
        filtered = filtered.filter((p: any) => p.nicheId === input.nicheId);
      }

      // Filter by location if provided
      if (input.locationId) {
        filtered = filtered.filter((p: any) => p.locationId === input.locationId);
      }

      // Filter by published status if provided
      if (input.published !== undefined) {
        filtered = filtered.filter((p: any) => p.published === input.published);
      }

      return filtered;
    }),

  // Get single page by slug (public)
  getPageBySlug: publicProcedure
    .input(z.object({
      slug: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const page = await getPseoPageBySlug(input.slug);
      return page;
    }),

  // Generate pages for niche × location combinations
  generatePages: protectedProcedure
    .input(z.object({
      nicheId: z.number().optional(),
      locationId: z.number().optional(),
      regenerate: z.boolean().default(false), // Regenerate existing pages
    }))
    .mutation(async ({ input }) => {
      const niches = input.nicheId 
        ? (await getPseoNiches()).filter((n: PseoNiche) => n.id === input.nicheId)
        : await getPseoNiches();

      const locations = input.locationId
        ? (await getPseoLocations()).filter((l: PseoLocation) => l.id === input.locationId)
        : await getPseoLocations();

      let pagesCreated = 0;
      let pagesSkipped = 0;

      for (const niche of niches) {
        for (const location of locations) {
          const path = `/${niche.slug}-${location.slug}`;

          // Check if page already exists
          const existing = await getPseoPageBySlug(`${niche.slug}-${location.slug}`);
          if (existing && !input.regenerate) {
            pagesSkipped++;
            continue;
          }

          // Generate content
          const content = generatePageContent(niche, location);

          if (existing && input.regenerate) {
            // Update existing page
            await updatePseoPageContent(existing.id, content.content, content.title, content.metaDescription);
          } else {
            // Create new page
            await createPseoPage({
              nicheId: niche.id,
              locationId: location.id,
              path,
              title: content.title,
              metaDescription: content.metaDescription,
              contentOverride: content.content,
              published: true,
            });
            pagesCreated++;
          }
        }
      }

      return {
        success: true,
        pagesCreated,
        pagesSkipped,
        totalNiches: niches.length,
        totalLocations: locations.length,
      };
    }),

  // Get page statistics
  getStats: protectedProcedure.query(async () => {
    const pages = await getPseoPages(10000, 0);
    const niches = await getPseoNiches();
    const locations = await getPseoLocations();

    return {
      totalPages: pages.length,
      publishedPages: pages.filter((p: any) => p.published).length,
      totalNiches: niches.length,
      totalLocations: locations.length,
      potentialPages: niches.length * locations.length,
    };
  }),
});

/**
 * Generate SEO-optimized content for a niche × location page
 */
function generatePageContent(niche: PseoNiche, location: PseoLocation) {
  const title = `${niche.label} in ${location.city}, ${location.state}`;
  const metaDescription = `Find trusted ${niche.label.toLowerCase()} services in ${location.city}, ${location.state}. Get instant quotes from verified local businesses. Free, no obligation.`;

  const content = `
# ${title}

Looking for a reliable ${niche.label.toLowerCase()} in ${location.city}? Local Lead AU connects you with verified local businesses in your area.

## Why Choose Local ${niche.label} Services in ${location.city}?

When you need ${niche.label.toLowerCase()} services in ${location.city}, choosing a local provider offers several advantages:

- **Fast Response Times**: Local businesses can respond quickly to your needs
- **Local Knowledge**: They understand the specific requirements of ${location.city} and ${location.state}
- **Community Trust**: Established reputation within the ${location.city} community
- **Competitive Pricing**: Local competition keeps prices fair and reasonable

## How It Works

1. **Submit Your Request**: Tell us what you need
2. **Get Matched**: We connect you with verified ${niche.label.toLowerCase()} providers in ${location.city}
3. **Compare Quotes**: Receive multiple quotes to compare
4. **Choose the Best**: Select the provider that meets your needs

## Service Areas

We connect you with ${niche.label.toLowerCase()} services throughout ${location.regionLabel}.

## Get Started Today

Ready to find the right ${niche.label.toLowerCase()} for your needs? Submit your request now and get connected with trusted local businesses in ${location.city}.

[Get Free Quotes](#contact)

---

*Local Lead AU - Connecting Australian businesses with local customers since 2025*
`;

  return {
    title,
    content: content.trim(),
    metaDescription,
  };
}
