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
