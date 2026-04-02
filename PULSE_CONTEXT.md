# PULSE — Project Context & Architecture Guide

> Last updated: March 2026  
> This file is the single source of truth for the Pulse platform.  
> Read this before touching any code. Update it when architecture changes.

---

## What is Pulse?

Pulse is a market intelligence platform for renewable energy professionals — specifically solar PV and BESS developers, owners, and operators. It started as an internal tool for a multifamily DER developer and is being built toward a free community platform for the broader industry.

**Core value proposition:**
- Curated news feed from trusted sources, auto-tagged by state and topic
- Live market data — electricity rates, solar production, cost benchmarks
- State-by-state policy and incentive intelligence
- DC adder and FEOC compliance tracking
- Built by a developer for developers — not a generic energy news aggregator

**Vision:**
A user signs up, tells Pulse what they do, what markets they work in, and what technologies they focus on. Their feed, dashboards, and state guides are automatically scoped to their profile. The platform gets smarter as more people use it — community-contributed sources and engagement signals improve content quality over time.

**Current status:** Internal MVP, single-tenant. Auth and user profiles are the next major milestone before public launch.

**Intended name:** Pulse (was EnergyPulse — renamed)

---

## Who built this

- **Owner:** Tejas — DER developer/owner/operator, multifamily residential solar + BESS
- **Markets:** California, New York, Texas, Massachusetts, New Jersey, Colorado
- **Stack decisions:** Made collaboratively with Claude across multiple sessions

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Frontend | Lovable (React + Tailwind) | Hosted on Lovable Cloud |
| Backend | Supabase (Lovable Cloud) | Not external Supabase — accessed via Lovable Backend view |
| Database | PostgreSQL (via Supabase) | |
| Edge Functions | Deno (via Supabase) | Deployed via GitHub commits |
| Version control | GitHub | `TV2802/solar-magazine-weekly` |
| Charts | Recharts | Already installed |
| Maps | react-simple-maps + d3-geo | US map component |
| Routing | react-router-dom | Already configured |

**Important:** Supabase is Lovable-hosted. There is no separate supabase.com account. Access the database via Lovable → Views → Backend → SQL Editor. Secrets live in Lovable → Backend → Secrets.

**GitHub is the preferred method for all heavy code changes.** Lovable credits are reserved for UI iteration and visual work only.

---

## Repository Structure

```
src/
  components/
    ElectricityRateMap.tsx     — Interactive US map, ISO regions, click to open state guide
    TrackedStatesTable.tsx     — Comparison table for tracked states
    StatePreviewPanel.tsx      — Slide-in panel on state click (first impression)
    BenchmarkDashboard.tsx     — Cost benchmarks with Residential/Commercial/Compare tabs
    ComplianceTracker.tsx      — DC adder + FEOC/MACR compliance tracker
    SiteNav.tsx                — Top navigation
    SiteFooter.tsx             — Footer
  pages/
    Index.tsx                  — Main articles feed
    MarketIntelligence.tsx     — Market Intelligence page (map + benchmarks + compliance)
    market/
      CA.tsx                   — California Hub (exemplar state page)
    Archive.tsx                — (deprecated — merged into main feed)
    Saved.tsx                  — (deprecated — saved articles in drawer)
    NotFound.tsx               — 404
  App.tsx                      — Routes

supabase/
  functions/
    fetch-articles/            — Main content pipeline (v4)
    generate-digest/           — AI digest generation
    eia-rates/                 — Live EIA electricity rates (all 50 states)
    pvwatts-states/            — NREL solar production data (cached 30 days)
    atb-benchmarks/            — NREL ATB cost benchmarks (cached 30 days)
    learn-state-keywords/      — Weekly ML-lite keyword learning job
```

---

## Database Schema

```sql
-- Core content
articles (
  id uuid PK,
  issue_id uuid FK → issues,
  title text,
  summary text,
  source_url text UNIQUE,
  source_name text,
  image_url text,
  topic text,                    -- legacy single topic
  tags text[],                   -- new multi-tag array
  states text[],                 -- state tags e.g. ['CA', 'NY']
  published_at timestamptz,
  relevance_score integer,
  is_featured boolean,
  created_at timestamptz
)

issues (
  id uuid PK,
  issue_number integer,
  week_start timestamptz,
  week_end timestamptz,
  digest_text text,
  created_at timestamptz
)

-- Engagement
article_feedback (article_id, vote 'up'/'down', created_at, session_id)
saved_articles (article_id, session_id, created_at)

-- Market data
market_metrics (metric_name, value, unit, trend, updated_at, notes, source)
atb_cache (metric_name, value, unit, atb_year, scenario, fetched_at)
pvwatts_cache (state_id, state_name, ac_annual, capacity_factor, fetched_at)

-- Intelligence
state_keywords (
  id uuid PK,
  keyword text,
  state text,                    -- two-letter abbr
  weight numeric(4,3),           -- 0.0–1.0, updated weekly by learn function
  article_count integer,
  is_locked boolean,             -- true = never auto-modify
  source text,                   -- 'seed' | 'learned' | 'manual'
  created_at, updated_at
  UNIQUE(keyword, state)
)

-- Ops
fetch_logs (run_at, articles_fetched, articles_published, articles_rejected, status, errors)
incentive_status (id, program_name, state, status, notes, updated_at)
```

---

## Content Pipeline

### Sources (current)
| Source | URL | Notes |
|--------|-----|-------|
| PV Magazine USA | `https://www.pv-magazine-usa.com/feed/` | ✅ Working |
| Solar Power World | `https://www.solarpowerworldonline.com/feed/` | ✅ Working |
| PV Tech | `https://www.pv-tech.org/feed/` | ✅ Working |
| ACORE | `https://acore.org/feed/` | ✅ Working |
| Utility Dive | `https://www.utilitydive.com/feeds/news/` | ✅ Working |

### How fetch-articles works (v4)
1. Loads state keywords from DB once per invocation
2. Fetches all 5 RSS feeds
3. For each article: relevance gate → score → state detection → topic assignment
4. Upserts to articles table with states[] array populated
5. Increments keyword article_count for matched keywords
6. Triggers generate-digest
7. Logs run to fetch_logs

### Cron schedule
- `fetch-articles` → every day at 7:00 AM UTC (`0 7 * * *`)
- `learn-state-keywords` → every Sunday at 6:00 AM UTC (`0 6 * * 0`)

Verify: `SELECT * FROM cron.job;` in SQL editor

### State detection logic
- Keywords loaded from `state_keywords` table (79 keywords across 6 states)
- Each article scored against all keywords
- States with weighted score ≥ 0.60 get tagged
- One article can have multiple state tags
- `learn-state-keywords` updates weights weekly based on engagement signals
- `is_locked = true` rows are never auto-modified (utility names, agencies)

### Content filters
**Must contain at least one of:**
solar, storage, battery, bess, der, distributed, rooftop, multifamily, residential, behind-the-meter, microgrid, vpp, itc, net metering, interconnection, photovoltaic, clean energy, renewable

**Rejected if title contains:**
electric vehicle, electric car, ev charging, ev battery, tesla model, rivian, offshore wind farm (+ others)

**Rejected if mentions non-US geography in title/summary**

**+20 relevance boost for:**
multifamily, rooftop, behind-the-meter, vpp, sgip, nem, net metering, interconnection, distributed generation, community solar, bess, residential solar

---

## Navigation Structure

```
PULSE (logo/home → /articles)    ARTICLES    MARKET    [bookmark icon]
```

Routes:
- `/` or `/articles` — Main feed
- `/market` — Market Intelligence page
- `/market/CA` — California Hub (exemplar)
- `/market/NY` etc — Future state hubs (not yet built)

---

## Market Intelligence Page

Four sections:
1. **US Electricity Rate Map** — Interactive, all 50 states, ISO region colored
   - Click state → StatePreviewPanel slides in from right
   - First click on untracked state → tracks it + shows rate popup with "View Guide" button
   - Already-tracked states → opens preview directly
   - Track/Untrack button lives inside preview panel only
2. **Selected States Comparison Table** — sortable, CSV export
3. **Cost Benchmarks** (BenchmarkDashboard) — Residential/Commercial/Compare tabs, Recharts
4. **DC & FEOC Compliance Tracker** (ComplianceTracker) — 4 tabs with current guidance

### Map interaction design principles
- Single click = open state preview (never silent toggle)
- Tracking is intentional — done from inside the preview panel
- Default tracked states: CA, NY, TX, MA, NJ, CO
- States can be untracked from preview panel OR X button in comparison table

---

## California Hub (/market/CA)

The exemplar state page. All other state pages follow this structure.

**4 tabs:**
- **Dashboard** — 4 headline numbers, utility breakdown table (PG&E/SCE/SDG&E/LADWP), NEM 3.0 quick facts
- **Policy** — CPUC proceedings tracker, interconnection by utility
- **Incentives** — SGIP budget categories with status, other programs
- **News** — CA-tagged articles from live feed, filterable by topic

**To add a new state hub:**
1. Copy `src/pages/market/CA.tsx`
2. Replace `STATE_DATA` constants at top of file
3. Add route in `App.tsx`: `<Route path="/market/NY" element={<NYHub />} />`
4. Add state to `hasFullHub` list in `StatePreviewPanel.tsx`
5. Add state headline data to `STATE_HEADLINES` in `StatePreviewPanel.tsx`

---

## Article Filter Bar

6 user-facing filters (internal tags are more granular — never exposed directly):

| Filter | Matches internal tags |
|--------|-----------------------|
| All | Everything |
| Solar + BESS | Solar, BESS, Battery |
| Policy & Incentives | Policy, Incentives, ITC, NEM, Federal |
| Grid & Utilities | Grid, Utilities, Interconnection, VPP |
| Multifamily | Multifamily, Residential |
| States ▾ | Dropdown — filters by states[] array |

States dropdown: My Markets (CA, NY, TX, MA, NJ, CO) pinned at top, all 50 states below. Multi-select supported.

---

## Compliance Tracker

**4 tabs:**
1. **DC Thresholds** — Manufactured products % by construction start year
   - 2026: 50% | 2027: 55% | Steel/iron: always 100% US
2. **FEOC / MACR** — Material assistance thresholds, 3 safe harbors
   - Effective Jan 1 2026 for new construction starts
   - Storage MACR: 55% non-PFE in 2026, increases 5pts/year to 75% by 2030
3. **BESS Manufacturers** — Expandable table, FEOC status per manufacturer
4. **Guidance Timeline** — IRS notices chronologically with links

**Key sources:**
- IRS Notice 2026-15 (Feb 12, 2026) — MACR guidance
- IRS Notice 2025-08 (Jan 16, 2025) — Updated elective safe harbor
- OBBBA (signed Jul 4, 2025) — One Big Beautiful Bill Act

---

## Cost Benchmarks

**Data sources:**
| Source | Coverage | Update frequency | Access |
|--------|----------|-----------------|--------|
| NREL ATB 2024 | PV + BESS CAPEX | Annual | Auto (atb-benchmarks edge function) |
| SEIA/WoodMac | Quarterly installed costs | Quarterly | Manual |
| LBL Tracking the Sun | DG installed costs by state | Annual | Manual |
| RMI/CPUC | DG economics, SGIP | As published | Manual |

**Current values (market_metrics table):**
- Residential PV: $2,680/kWDC (NREL ATB 2024 Moderate)
- Commercial PV: $1,640/kWDC
- Residential BESS (energy): $499/kWh
- Residential BESS (power): $1,598/kWDC
- ITC Rate: 30%
- SGIP Incentive: $0.40/Wh

---

## Key Architecture Decisions & Why

| Decision | Rationale |
|----------|-----------|
| GitHub for heavy lifting, Lovable for UI only | Lovable credits are expensive — save for visual iteration |
| `states text[]` array not a junction table | Articles can belong to multiple states, array is simpler and indexed with GIN |
| State keywords in DB not hardcoded | Allows weekly learning without code deploys |
| Real routes (`/market/CA`) not modals | Bookmarkable, shareable, scales to sub-routes |
| Single click opens preview, tracking inside panel | Separates navigation intent from comparison intent |
| 6 user-facing filters not 21 granular tags | User mental models don't match internal taxonomy |
| No AI summarization currently | Too costly, not needed for MVP |
| Fully automated pipeline | Zero manual article entry |
| US-only content filter | Company operates only in US markets |

---

## Build Principles

1. **Talk through architecture before writing any code** — always
2. **Think several steps ahead** — never execute literally, anticipate downstream effects
3. **Default states should not eliminate first-use experiences**
4. **Taxonomy should match user mental models** — not internal data structure
5. **Separation of concerns** — navigation and tracking are different user intentions
6. **Configuration lives at the top of files** — easy to edit without reading 300 lines
7. **Comments explain the why, not the what**
8. **Database is source of truth** — not hardcoded values in edge functions

---

## What's Next (Priority Order)

### Immediate
- [ ] Fix HTML stripping in remaining article summaries
- [ ] Mobile polish — filter bar and article cards
- [ ] NY, TX, MA, NJ, CO hub pages (copy CA structure)

### Short term
- [ ] Auth + user profiles (Supabase auth, already in stack)
  - Role: Developer / Investor / EPC / Utility / Consultant
  - Markets: Select states
  - Technologies: Solar / BESS / Wind / All
  - Sources: Curated list + add your own
- [ ] Onboarding flow — 4 questions on first visit
- [ ] Feed scoped to user profile

### Medium term
- [ ] Landing page before public launch
- [ ] Custom domain (pulse.energy or getpulse.io or similar)
- [ ] Source management — users add/suggest RSS feeds
- [ ] Community signal — upvotes surface content quality across users

### Long term (platform vision)
- [ ] Multi-tenant architecture
- [ ] Pro tier (deeper analytics, export, API)
- [ ] Team tier (shared workspaces, internal notes)
- [ ] White-label for consultants/law firms
- [ ] Anonymized trend data product

---

## How to Run Locally

The project runs entirely on Lovable Cloud — there is no local dev environment currently. All development happens via:
- Lovable chat interface (UI changes, integrations)
- GitHub direct commits (edge functions, component code)
- Lovable Backend SQL editor (migrations, data queries)

---

## Secrets Required

Set in Lovable → Backend → Secrets:
- `EIA_API_KEY` — from eia.gov (free)
- `NREL_API_KEY` — from developer.nrel.gov (free)

---

## Useful SQL Queries

```sql
-- Check article count by source
SELECT source_name, COUNT(*) FROM articles GROUP BY source_name ORDER BY count DESC;

-- Check state tagging coverage
SELECT 
  COUNT(*) FILTER (WHERE 'CA' = ANY(states)) as ca,
  COUNT(*) FILTER (WHERE 'NY' = ANY(states)) as ny,
  COUNT(*) FILTER (WHERE 'TX' = ANY(states)) as tx,
  COUNT(*) FILTER (WHERE 'MA' = ANY(states)) as ma,
  COUNT(*) FILTER (WHERE 'NJ' = ANY(states)) as nj,
  COUNT(*) FILTER (WHERE 'CO' = ANY(states)) as co,
  COUNT(*) FILTER (WHERE states != '{}') as total_tagged,
  COUNT(*) as total
FROM articles;

-- Check state keywords by state
SELECT state, COUNT(*) as keywords FROM state_keywords GROUP BY state ORDER BY state;

-- Check cron jobs
SELECT * FROM cron.job;

-- Check recent fetch logs
SELECT * FROM fetch_logs ORDER BY run_at DESC LIMIT 10;

-- Check keyword weights (top CA signals)
SELECT keyword, weight, article_count FROM state_keywords 
WHERE state = 'CA' ORDER BY weight DESC;
```

---

## Contact & Ownership

- GitHub: `TV2802/solar-magazine-weekly`
- Platform: Lovable Cloud
- Owner: Tejas
