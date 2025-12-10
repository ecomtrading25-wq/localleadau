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
- [ ] Create ScrapeJob model and status tracking
- [ ] Build prospect map view (Google Maps integration)
- [ ] Create prospect table with filters
- [ ] Implement prospect detail slide-over panel
- [ ] Add prospect status management
- [ ] Build "Convert to Lead" functionality
- [ ] Create prospect list management UI

### Campaign Management
- [ ] Create campaign template library
- [ ] Build campaign builder UI
- [ ] Implement campaign step editor
- [ ] Create campaign detail page with stats
- [ ] Implement "Add to campaign" functionality
- [ ] Add campaign performance metrics

### Lead Dashboard
- [ ] Create main dashboard with KPI cards
- [ ] Build leads table with filters
- [ ] Implement lead detail view
- [ ] Add lead status workflow
- [ ] Create lead activity timeline
- [ ] Build lead assignment
- [ ] Add lead notes and comments

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
