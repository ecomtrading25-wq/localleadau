# Local Lead AU - Web Project TODO

## Phase 1: MVP Core Features (Q1 2026)

### Database Schema & Models
- [x] Create Organisation model (multi-tenant support)
- [x] Create Lead model (business leads with status tracking)
- [x] Create Prospect model (pre-lead records from Maps scraping)
- [x] Create ProspectSource model (where prospects came from)
- [x] Create ProspectList model (saved lists of prospects)
- [x] Create Campaign model (email/SMS sequences)
- [x] Create CampaignStep model (individual steps in sequences)
- [x] Create Interaction model (lead activity tracking)
- [x] Add user-organisation relationships
- [x] Run database migrations

### Authentication & User Management
- [ ] Implement role-based access control (RBAC)
- [ ] Create organisation switcher for multi-tenant users
- [ ] Add user profile page

### Client Onboarding Wizard
- [x] Step 1: About your business
- [x] Step 2: Service areas
- [x] Step 3: Job types and average job value
- [x] Step 4: Lead handling preferences
- [x] Step 5: Review and confirm
- [x] Redirect logic (onboarded → dashboard, new → wizard)

### Prospecting Engine
- [x] Create ScrapeJob model and status tracking
- [ ] Build prospect map view (Google Maps integration)
- [x] Create prospect table with filters
- [ ] Implement prospect detail slide-over panel
- [x] Add prospect status management
- [x] Build "Convert to Lead" functionality
- [x] Create prospect list management UI

### Campaign Management
- [x] Create campaign database schema
- [x] Build campaigns list page
- [x] Implement campaign creation
- [x] Add campaign status management (draft/active/paused/completed)
- [x] Create campaign step model
- [ ] Build campaign step editor UI
- [ ] Create campaign template library
- [ ] Implement "Add to campaign" functionality
- [ ] Add campaign automation/scheduling

### Lead Dashboard
- [x] Create leads list page
- [x] Build leads table with filters
- [x] Implement lead detail sidebar
- [x] Add lead status workflow (new/contacted/qualified/proposal/won/lost)
- [x] Create lead activity timeline
- [x] Add lead notes and interactions
- [ ] Build lead assignment UI
- [ ] Implement lead search

### ROI Calculator
- [ ] Create shared ROI calculation logic
- [ ] Build marketing site ROI calculator page
- [ ] Create interactive form
- [ ] Display results
- [ ] Build in-app ROI summary card

## Phase 2: Programmatic SEO (Q1 2026)

- [ ] Create PseoNiche model
- [ ] Create PseoLocation model
- [ ] Create PseoPage model
- [ ] Seed 50 niches and 400 locations
- [ ] Generate 2,000 PseoPage records
- [ ] Create dynamic route /leads/[niche]/[location]
- [ ] Build page components
- [ ] Implement SEO optimization

## Phase 3: Billing & Subscriptions (Q1-Q2 2026)

- [ ] Set up Stripe integration
- [ ] Create BillingPlan and Subscription models
- [ ] Build pricing page
- [ ] Implement checkout flow
- [ ] Create billing settings page
- [ ] Add webhook handler

## Future Phases

- [ ] Reporting & Analytics
- [ ] Agency & White-Label
- [ ] Help Center & Support
- [ ] SuperAdmin Backoffice
- [ ] Public API & Webhooks

## Phase 6: Stripe Webhooks & Automation

### Stripe Webhooks
- [x] Create webhook endpoint `/api/webhooks/stripe`
- [x] Implement signature verification
- [x] Handle `checkout.session.completed` event
- [x] Handle `invoice.paid` event
- [x] Handle `invoice.payment_failed` event
- [x] Handle `customer.subscription.updated` event
- [x] Handle `customer.subscription.deleted` event
- [x] Add webhook event logging
- [ ] Test webhook handlers with Stripe CLI
- [ ] Configure webhook in Stripe dashboard

## Phase 7: Usage Tracking & Limits Enforcement

### Usage Tracking
- [x] Create usage tracking functions (count prospects, leads, campaigns)
- [x] Add monthly usage reset logic based on billing period
- [x] Build usage dashboard widget with progress bars
- [x] Implement limit checking before actions
- [x] Add upgrade prompts when limits exceeded
- [ ] Create usage history tracking table
- [ ] Add usage alerts/notifications

### Limit Enforcement
- [x] Check prospect limit before scraping
- [x] Check lead limit before converting prospects
- [x] Check campaign limit before creating campaigns
- [x] Show upgrade modal when limit exceeded
- [x] Add "View Plans" link in limit warnings

## Phase 8: Programmatic SEO Engine

### pSEO Management
- [x] Create niche management UI (add/edit/delete niches)
- [x] Create location management UI (add/edit/delete locations)
- [x] Build page generation system (niche × location combinations)
- [x] Implement dynamic content templates with local keywords
- [x] Create SEO-friendly public routes (/niche-location)
- [x] Add meta tags (title, description)
- [x] Implement page regeneration on content updates
- [ ] Add schema markup (LocalBusiness, Service, BreadcrumbList)
- [ ] Generate XML sitemap for search engines
- [ ] Build pSEO analytics dashboard (page views, rankings)

### Content Generation
- [ ] Create content templates for each niche
- [ ] Add location-specific content (suburbs, postcodes, landmarks)
- [ ] Generate unique content for each page (avoid duplicate content)
- [ ] Add call-to-action sections with lead capture forms
- [ ] Include testimonials and trust signals
- [ ] Add internal linking between related pages

## Phase 9: Seed pSEO Data & Sitemap

### Seed Data
- [x] Create seed script for common Australian trades (30 niches)
- [x] Create seed script for major Australian cities (37 locations)
- [x] Add niche categories (tradies, home services, health, automotive, professional)
- [x] Add major cities across all Australian states
- [ ] Auto-generate pages after seeding
- [ ] Add suburb-level locations for major cities

### XML Sitemap
- [x] Generate sitemap.xml for all published pages
- [x] Add sitemap route (/sitemap.xml)
- [x] Add lastmod timestamps
- [x] Add changefreq and priority
- [ ] Update sitemap when pages are generated (currently manual)
- [ ] Submit to Google Search Console

## Phase 10: Help Center & Support

### Help Center
- [x] Create help article router (CRUD operations)
- [x] Build public help center page with category browsing
- [x] Implement article search functionality
- [x] Create admin article editor with markdown support
- [x] Add article categories (Getting Started, Features, Billing, Troubleshooting, API, Integrations)
- [x] Implement article publishing workflow (draft/published)
- [ ] Add article view tracking
- [ ] Create "Was this helpful?" feedback system

### Feedback System
- [ ] Create feedback collection form
- [ ] Build feedback management dashboard
- [ ] Add feedback categories (bug, feature request, general)
- [ ] Implement feedback status tracking
- [ ] Add email notifications for new feedback

## Phase 11: Campaign Automation Engine

### Template Variables
- [x] Design template variable system ({{firstName}}, {{businessName}}, {{city}}, etc.)
- [x] Implement variable replacement in email/SMS content
- [x] Add variable preview function
- [x] Handle missing variables gracefully
- [ ] Add variable picker UI in campaign editor
- [ ] Create variable documentation for users

### Scheduled Sending
- [x] Design cron job architecture for campaign execution
- [x] Implement campaign step scheduler (runs every minute)
- [x] Add delay logic between steps (days)
- [x] Create sending queue system
- [x] Implement retry logic for failed sends
- [ ] Add rate limiting to prevent spam
- [ ] Add manual campaign execution trigger

### Delivery Tracking
- [ ] Add delivery status tracking (sent/delivered/bounced/failed)
- [ ] Implement open tracking (email only)
- [ ] Add click tracking for links
- [ ] Track reply detection
- [ ] Create delivery analytics dashboard
- [ ] Add recipient-level status view

### Email Integration
- [x] Choose email provider (SendGrid)
- [x] Implement email sending API integration
- [x] Add email template rendering with HTML
- [x] Add unsubscribe link management
- [ ] Configure SPF/DKIM/DMARC for deliverability
- [ ] Handle bounce and complaint webhooks
- [ ] Add email preview before sending

### SMS Integration
- [ ] Choose SMS provider (Twilio, MessageBird, or AWS SNS)
- [ ] Implement SMS sending API integration
- [ ] Add SMS template rendering
- [ ] Handle delivery receipts
- [ ] Add opt-out management
- [ ] Implement SMS character counting

### Automated Follow-ups
- [ ] Design trigger system (lead status change, time-based, action-based)
- [ ] Implement trigger evaluation engine
- [ ] Add conditional logic (if/then rules)
- [ ] Create follow-up sequence templates
- [ ] Add trigger management UI
- [ ] Implement trigger testing/preview

### Campaign Analytics
- [ ] Build campaign performance dashboard
- [ ] Add open rate, click rate, reply rate metrics
- [ ] Create conversion tracking (lead → customer)
- [ ] Implement A/B testing framework
- [ ] Add campaign comparison view
- [ ] Export campaign reports

### Testing
- [ ] Write tests for template variable replacement
- [ ] Test scheduled sending logic
- [ ] Test delivery tracking
- [ ] Test email/SMS integration
- [ ] Test automated triggers
- [ ] End-to-end campaign flow test

## Phase 12: Platform Activation

### SEO Page Generation
- [x] Generate all 1,548 pSEO landing pages (36 niches × 43 locations)
- [x] Verify page generation completed successfully
- [ ] Test sample pages render correctly
- [ ] Submit sitemap to Google Search Console

### Help Articles
- [x] Create "Getting Started" guide
- [x] Create "How to Find Prospects" article
- [x] Create "How to Create Campaigns" article
- [x] Create "Managing Your Subscription" article
- [x] Create "Troubleshooting Common Issues" article

### System Verification
- [x] Verify dev server is running
- [x] Check campaign scheduler is active
- [x] Verify TypeScript compilation has no errors
- [x] Check all dependencies are installed
- [ ] Test complete user journey (signup → prospect → lead → campaign)
- [ ] Verify Stripe checkout flow works
- [ ] Test email sending via SendGrid

### Pilot Launch Preparation
- [ ] Create pilot program landing page
- [ ] Prepare onboarding email templates
- [ ] Set up feedback collection process
- [ ] Create pilot customer success metrics

## Phase 13: Railway Deployment

### Configuration Files
- [ ] Create railway.json configuration
- [ ] Create Procfile for process management
- [ ] Update package.json build scripts
- [ ] Create .railwayignore file

### Database Setup
- [ ] Provision MySQL database on Railway
- [ ] Run database migrations
- [ ] Seed billing plans
- [ ] Seed pSEO data

### Environment Variables
- [ ] Configure DATABASE_URL
- [ ] Configure JWT_SECRET
- [ ] Configure SendGrid API key
- [ ] Configure Stripe keys
- [ ] Configure OAuth settings
- [ ] Configure all other environment variables

### Deployment
- [ ] Connect GitHub repository to Railway
- [ ] Deploy application
- [ ] Verify deployment successful
- [ ] Test production URL
