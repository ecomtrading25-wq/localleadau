import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createHelpArticle,
  getHelpArticles,
  getHelpArticleBySlug,
  updateHelpArticle,
  deleteHelpArticle,
  searchHelpArticles,
  getHelpArticleById,
} from "../db";

export const helpRouter = router({
  // Public endpoints
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        published: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return getHelpArticles({
        category: input?.category,
        published: input?.published ?? true, // Default to published only for public
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await getHelpArticleBySlug(input.slug);
      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }
      return article;
    }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return searchHelpArticles(input.query);
    }),

  // Admin endpoints
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        slug: z.string(),
        body: z.string(),
        category: z.string(),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can create articles
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create help articles",
        });
      }

      const articleId = await createHelpArticle({
        title: input.title,
        slug: input.slug,
        body: input.body,
        category: input.category,
        published: input.published,
      });

      return { success: true, articleId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        body: z.string().optional(),
        category: z.string().optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can update articles
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update help articles",
        });
      }

      await updateHelpArticle(input.id, {
        title: input.title,
        slug: input.slug,
        body: input.body,
        category: input.category,
        published: input.published,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete articles
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete help articles",
        });
      }

      await deleteHelpArticle(input.id);

      return { success: true };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      // Only admins can get unpublished articles by ID
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access unpublished articles",
        });
      }

      const article = await getHelpArticleById(input.id);
      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      return article;
    }),

  categories: publicProcedure.query(() => {
    return [
      { value: "getting-started", label: "Getting Started" },
      { value: "features", label: "Features" },
      { value: "billing", label: "Billing" },
      { value: "troubleshooting", label: "Troubleshooting" },
      { value: "api", label: "API" },
      { value: "integrations", label: "Integrations" },
    ];
  }),
});
