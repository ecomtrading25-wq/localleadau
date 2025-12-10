import { getDb } from "./db";
import { pseoPages } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate XML sitemap for all published pSEO pages
 */
export async function generateSitemap(baseUrl: string): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all published pages
  const pages = await db
    .select()
    .from(pseoPages)
    .where(eq(pseoPages.published, true));

  // Build XML
  const urls = pages.map(page => {
    const lastmod = page.updatedAt ? page.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `  <url>
    <loc>${baseUrl}/${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return sitemap;
}
