# CLAUDE.md — Pulse Project Instructions

> Read this before touching any file. This is the single source of truth for how Pulse is built.

---

## What is Pulse?

Pulse is a market intelligence platform for solar PV + BESS developers, owners, and operators. Started as an internal tool for a multifamily DER developer (Tejas), being built toward a free community platform for the broader renewable energy industry.

**GitHub repo:** `TV2802/solar-magazine-weekly`
**Frontend:** Lovable Cloud (React + Tailwind)
**Backend:** Supabase (Lovable-hosted — NOT a separate supabase.com account)

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | React + Tailwind (via Lovable) |
| Backend | Supabase (Lovable-hosted) |
| Database | PostgreSQL |
| Edge Functions | Deno (deployed via GitHub commits) |
| Charts | Recharts |
| Maps | react-simple-maps + d3-geo |
| Routing | react-router-dom |

---

## Repository Structure

```
src/
  components/
    ElectricityRateMap.tsx     — Interactive US map, ISO regions, click to open state preview
    TrackedStatesTable.tsx     — Comparison table for tracked states
    StatePreviewPanel.tsx      — Slide-in panel on state click
    BenchmarkDashboard.tsx     — Cost benchmarks (Residential/Commercial/Compare tabs)
    ComplianceTracker.tsx      — DC adder + FEOC/MACR compliance tracker
    SiteNav.tsx                — Top navigation
    SiteFooter.tsx             — Footer
  pages/
    Index.tsx                  — Main articles feed
    MarketIntelligence.tsx     — Market Intelligence page
    market/
      CA.tsx                   — California Hub (exemplar — all state hubs follow this pattern)
  App.tsx                      — Routes

supabase/
  functions/
    fetch-articles/            — Main content pipeline (v4)
    generate-digest/           — AI digest generation
    eia-rates/                 — Live EIA electricity rates
    pvwatts-states/            — NREL solar production data
    atb-benchmarks/            — NREL ATB cost benchmarks
    learn-state-keywords/      — Weekly keyword learning job
```

---

## Database Schema (key tables)

```sql
articles (id, title, summary, source_url, source_name, image_url, topic, tags text[], states text[], published_at, relevance_score, is_featured, created_at)
issues (id, issue_number, week_start, week_end, digest_text, created_at)
article_feedback (article_id, vote, created_at, session_id)
saved_articles (article_id, session_id, created_at)
market_metrics (metric_name, value, unit, trend, updated_at, notes, source)
state_keywords (id, keyword, state, weight numeric(4,3), article_count, is_locked, source, created_at, updated_at)
fetch_logs (run_at, articles_fetched, articles_published, articles_rejected, status, errors)
incentive_status (id, program_name, state, status, notes, updated_at)
```

**Key design decision:** `states` is a `text[]` array (GIN indexed), not a junction table. One article can have multiple state tags.

---

## Routes

```
/              → Main feed (Index.tsx)
/articles      → Main feed (same)
/market        → Market Intelligence page
/market/CA     → California Hub (built)
/market/NY     → New York Hub (not yet built)
/market/TX     → Texas Hub (not yet built)
/market/MA     → Massachusetts Hub (not yet built)
/market/NJ     → New Jersey Hub (not yet built)
/market/CO     → Colorado Hub (not yet built)
```

---

## Adding a New State Hub (exact steps)

1. Copy `src/pages/market/CA.tsx` → rename to e.g. `NY.tsx`
2. Replace `STATE_DATA` constants at the top of the file with state-specific data
3. Add route in `App.tsx`: `<Route path="/market/NY" element={<NYHub />} />`
4. Add state to `hasFullHub` array in `StatePreviewPanel.tsx`
5. Add state headline data to `STATE_HEADLINES` in `StatePreviewPanel.tsx`

---

## Article Filter Bar

6 user-facing filters only — never expose internal tags directly:

| Filter | Internal tags matched |
|--------|-----------------------|
| All | Everything |
| Solar + BESS | Solar, BESS, Battery |
| Policy & Incentives | Policy, Incentives, ITC, NEM, Federal |
| Grid & Utilities | Grid, Utilities, Interconnection, VPP |
| Multifamily | Multifamily, Residential |
| States ▾ | Filters by states[] array |

---

## Map Interaction Rules

- Single click = open StatePreviewPanel (never a silent toggle)
- Tracking a state is intentional — only done from inside the preview panel
- Default tracked states: CA, NY, TX, MA, NJ, CO
- Untrack from preview panel OR via X button in comparison table

---

## Content Pipeline

5 RSS sources: PV Magazine USA, Solar Power World, PV Tech, ACORE, Utility Dive

Cron:
- `fetch-articles` → daily 7:00 AM UTC
- `learn-state-keywords` → Sunday 6:00 AM UTC

State detection: keywords from DB, weighted score ≥ 0.60 to tag a state. `is_locked = true` rows are never auto-modified.

---

## Build Principles — Follow These Always

1. **Discuss architecture before writing any code** — think through approach first
2. **Think several steps ahead** — anticipate downstream effects, never execute literally
3. **Configuration lives at the top of files** — constants and data at the top, never buried
4. **Comments explain the why, not the what**
5. **Database is source of truth** — never hardcode values that live in the DB
6. **Separation of concerns** — navigation intent and tracking intent are different things
7. **Taxonomy matches user mental models** — 6 user-facing filters, not 21 internal tags
8. **Do not eliminate first-use experiences** — default states should not prevent onboarding moments

---

## What NOT to Do

- Do not create a local dev server — this runs entirely on Lovable Cloud
- Do not add new npm packages without confirming first — stack is fixed
- Do not modify the Supabase schema without being asked — migrations are manual
- Do not hardcode electricity rates, benchmark values, or keyword lists — these live in the DB
- Do not expose internal article tags directly to users — use the 6 filter mapping only
- Do not rename the app — it is Pulse (not EnergyPulse)

---

## Immediate Priorities (work on these first)

1. Fix HTML stripping in article summaries
2. Mobile polish — filter bar and article cards
3. Build NY, TX, MA, NJ, CO hub pages (copy CA.tsx structure exactly)

---

## Owner

Tejas — DER developer/owner/operator, multifamily solar + BESS, markets: CA, NY, TX, MA, NJ, CO
