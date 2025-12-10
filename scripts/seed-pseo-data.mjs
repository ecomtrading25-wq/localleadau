import { drizzle } from "drizzle-orm/mysql2";
import { pseoNiches, pseoLocations } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

/**
 * Common Australian trades and services
 */
const NICHES = [
  // Tradies
  { slug: "plumber", label: "Plumber", pluralLabel: "Plumbers", category: "tradies" },
  { slug: "electrician", label: "Electrician", pluralLabel: "Electricians", category: "tradies" },
  { slug: "carpenter", label: "Carpenter", pluralLabel: "Carpenters", category: "tradies" },
  { slug: "painter", label: "Painter", pluralLabel: "Painters", category: "tradies" },
  { slug: "landscaper", label: "Landscaper", pluralLabel: "Landscapers", category: "tradies" },
  { slug: "tiler", label: "Tiler", pluralLabel: "Tilers", category: "tradies" },
  { slug: "roofer", label: "Roofer", pluralLabel: "Roofers", category: "tradies" },
  { slug: "builder", label: "Builder", pluralLabel: "Builders", category: "tradies" },
  { slug: "bricklayer", label: "Bricklayer", pluralLabel: "Bricklayers", category: "tradies" },
  { slug: "plasterer", label: "Plasterer", pluralLabel: "Plasterers", category: "tradies" },
  
  // Home Services
  { slug: "cleaner", label: "Cleaner", pluralLabel: "Cleaners", category: "home_services" },
  { slug: "pest-control", label: "Pest Control", pluralLabel: "Pest Control Services", category: "home_services" },
  { slug: "locksmith", label: "Locksmith", pluralLabel: "Locksmiths", category: "home_services" },
  { slug: "handyman", label: "Handyman", pluralLabel: "Handymen", category: "home_services" },
  { slug: "removalist", label: "Removalist", pluralLabel: "Removalists", category: "home_services" },
  { slug: "gardener", label: "Gardener", pluralLabel: "Gardeners", category: "home_services" },
  { slug: "pool-cleaner", label: "Pool Cleaner", pluralLabel: "Pool Cleaners", category: "home_services" },
  { slug: "window-cleaner", label: "Window Cleaner", pluralLabel: "Window Cleaners", category: "home_services" },
  
  // Automotive
  { slug: "mechanic", label: "Mechanic", pluralLabel: "Mechanics", category: "automotive" },
  { slug: "auto-electrician", label: "Auto Electrician", pluralLabel: "Auto Electricians", category: "automotive" },
  { slug: "panel-beater", label: "Panel Beater", pluralLabel: "Panel Beaters", category: "automotive" },
  { slug: "mobile-mechanic", label: "Mobile Mechanic", pluralLabel: "Mobile Mechanics", category: "automotive" },
  
  // Health & Wellness
  { slug: "dentist", label: "Dentist", pluralLabel: "Dentists", category: "health" },
  { slug: "physiotherapist", label: "Physiotherapist", pluralLabel: "Physiotherapists", category: "health" },
  { slug: "chiropractor", label: "Chiropractor", pluralLabel: "Chiropractors", category: "health" },
  { slug: "massage-therapist", label: "Massage Therapist", pluralLabel: "Massage Therapists", category: "health" },
  
  // Professional Services
  { slug: "accountant", label: "Accountant", pluralLabel: "Accountants", category: "professional" },
  { slug: "lawyer", label: "Lawyer", pluralLabel: "Lawyers", category: "professional" },
  { slug: "real-estate-agent", label: "Real Estate Agent", pluralLabel: "Real Estate Agents", category: "professional" },
  { slug: "financial-advisor", label: "Financial Advisor", pluralLabel: "Financial Advisors", category: "professional" },
];

/**
 * Major Australian cities and regions
 */
const LOCATIONS = [
  // NSW
  { slug: "sydney", city: "Sydney", state: "NSW", regionLabel: "Greater Sydney" },
  { slug: "newcastle", city: "Newcastle", state: "NSW", regionLabel: "Newcastle and Lake Macquarie" },
  { slug: "wollongong", city: "Wollongong", state: "NSW", regionLabel: "Illawarra" },
  { slug: "central-coast", city: "Central Coast", state: "NSW", regionLabel: "Central Coast" },
  { slug: "parramatta", city: "Parramatta", state: "NSW", regionLabel: "Western Sydney" },
  { slug: "penrith", city: "Penrith", state: "NSW", regionLabel: "Western Sydney" },
  { slug: "liverpool", city: "Liverpool", state: "NSW", regionLabel: "South Western Sydney" },
  { slug: "blacktown", city: "Blacktown", state: "NSW", regionLabel: "Western Sydney" },
  { slug: "north-sydney", city: "North Sydney", state: "NSW", regionLabel: "Lower North Shore" },
  { slug: "manly", city: "Manly", state: "NSW", regionLabel: "Northern Beaches" },
  
  // VIC
  { slug: "melbourne", city: "Melbourne", state: "VIC", regionLabel: "Greater Melbourne" },
  { slug: "geelong", city: "Geelong", state: "VIC", regionLabel: "Greater Geelong" },
  { slug: "ballarat", city: "Ballarat", state: "VIC", regionLabel: "Ballarat" },
  { slug: "bendigo", city: "Bendigo", state: "VIC", regionLabel: "Bendigo" },
  { slug: "frankston", city: "Frankston", state: "VIC", regionLabel: "Mornington Peninsula" },
  { slug: "dandenong", city: "Dandenong", state: "VIC", regionLabel: "South East Melbourne" },
  { slug: "casey", city: "Casey", state: "VIC", regionLabel: "South East Melbourne" },
  
  // QLD
  { slug: "brisbane", city: "Brisbane", state: "QLD", regionLabel: "Greater Brisbane" },
  { slug: "gold-coast", city: "Gold Coast", state: "QLD", regionLabel: "Gold Coast" },
  { slug: "sunshine-coast", city: "Sunshine Coast", state: "QLD", regionLabel: "Sunshine Coast" },
  { slug: "townsville", city: "Townsville", state: "QLD", regionLabel: "Townsville" },
  { slug: "cairns", city: "Cairns", state: "QLD", regionLabel: "Cairns" },
  { slug: "toowoomba", city: "Toowoomba", state: "QLD", regionLabel: "Toowoomba" },
  { slug: "ipswich", city: "Ipswich", state: "QLD", regionLabel: "Ipswich" },
  
  // WA
  { slug: "perth", city: "Perth", state: "WA", regionLabel: "Greater Perth" },
  { slug: "fremantle", city: "Fremantle", state: "WA", regionLabel: "Fremantle" },
  { slug: "joondalup", city: "Joondalup", state: "WA", regionLabel: "Joondalup" },
  { slug: "mandurah", city: "Mandurah", state: "WA", regionLabel: "Peel" },
  { slug: "bunbury", city: "Bunbury", state: "WA", regionLabel: "South West" },
  
  // SA
  { slug: "adelaide", city: "Adelaide", state: "SA", regionLabel: "Greater Adelaide" },
  { slug: "mount-gambier", city: "Mount Gambier", state: "SA", regionLabel: "Limestone Coast" },
  { slug: "whyalla", city: "Whyalla", state: "SA", regionLabel: "Eyre Peninsula" },
  
  // TAS
  { slug: "hobart", city: "Hobart", state: "TAS", regionLabel: "Greater Hobart" },
  { slug: "launceston", city: "Launceston", state: "TAS", regionLabel: "Launceston" },
  
  // NT
  { slug: "darwin", city: "Darwin", state: "NT", regionLabel: "Greater Darwin" },
  { slug: "alice-springs", city: "Alice Springs", state: "NT", regionLabel: "Central Australia" },
  
  // ACT
  { slug: "canberra", city: "Canberra", state: "ACT", regionLabel: "Australian Capital Territory" },
];

async function seedPseoData() {
  console.log("🌱 Seeding pSEO data...\n");

  // Seed niches
  console.log(`📋 Seeding ${NICHES.length} niches...`);
  let nicheCount = 0;
  for (const niche of NICHES) {
    try {
      await db.insert(pseoNiches).values({
        slug: niche.slug,
        label: niche.label,
        pluralLabel: niche.pluralLabel,
        category: niche.category,
        active: true,
      });
      nicheCount++;
      console.log(`  ✓ ${niche.label} (${niche.category})`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`  ⊘ ${niche.label} (already exists)`);
      } else {
        console.error(`  ✗ ${niche.label}: ${error.message}`);
      }
    }
  }
  console.log(`\n✅ Seeded ${nicheCount} new niches\n`);

  // Seed locations
  console.log(`📍 Seeding ${LOCATIONS.length} locations...`);
  let locationCount = 0;
  for (const location of LOCATIONS) {
    try {
      await db.insert(pseoLocations).values({
        slug: location.slug,
        city: location.city,
        state: location.state,
        regionLabel: location.regionLabel,
        active: true,
      });
      locationCount++;
      console.log(`  ✓ ${location.city}, ${location.state}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`  ⊘ ${location.city}, ${location.state} (already exists)`);
      } else {
        console.error(`  ✗ ${location.city}, ${location.state}: ${error.message}`);
      }
    }
  }
  console.log(`\n✅ Seeded ${locationCount} new locations\n`);

  console.log("🎉 pSEO data seeding complete!");
  console.log(`\n📊 Potential pages: ${NICHES.length} niches × ${LOCATIONS.length} locations = ${NICHES.length * LOCATIONS.length} pages`);
  console.log("\n💡 Next step: Generate pages by visiting /pseo-admin and clicking 'Generate New Pages'");
  
  process.exit(0);
}

seedPseoData().catch((error) => {
  console.error("❌ Error seeding pSEO data:", error);
  process.exit(1);
});
