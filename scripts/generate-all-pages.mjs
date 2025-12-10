import { drizzle } from "drizzle-orm/mysql2";
import { pseoNiches, pseoLocations, pseoPages } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function generateAllPages() {
  console.log("[Page Generator] Starting page generation...");
  
  // Get all niches
  const niches = await db.select().from(pseoNiches);
  console.log(`[Page Generator] Found ${niches.length} niches`);
  
  // Get all locations
  const locations = await db.select().from(pseoLocations);
  console.log(`[Page Generator] Found ${locations.length} locations`);
  
  let created = 0;
  let skipped = 0;
  
  for (const niche of niches) {
    for (const location of locations) {
      const path = `/${niche.slug}-${location.slug}`;
      
      // Check if page already exists
      const existing = await db
        .select()
        .from(pseoPages)
        .where(eq(pseoPages.path, path))
        .limit(1);
      
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      
      // Create page
      await db.insert(pseoPages).values({
        nicheId: niche.id,
        locationId: location.id,
        path,
        title: `${niche.label} in ${location.city}, ${location.state}`,
        metaDescription: `Find the best ${niche.pluralLabel} in ${location.city}, ${location.state}. Get quotes, compare prices, and hire local ${niche.pluralLabel} near you.`,
        h1: `${niche.label} in ${location.city}`,
        published: true,
      });
      
      created++;
      
      if (created % 100 === 0) {
        console.log(`[Page Generator] Created ${created} pages so far...`);
      }
    }
  }
  
  console.log(`[Page Generator] Complete! Created ${created} pages, skipped ${skipped} existing pages.`);
  console.log(`[Page Generator] Total pages: ${created + skipped}`);
}

generateAllPages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[Page Generator] Error:", error);
    process.exit(1);
  });
