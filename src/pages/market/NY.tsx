// ============================================================
// pages/market/NY.tsx — New York Hub
// Follows the exact structure of CA.tsx — only the data
// constants below differ.
//
// TABS:
//   Dashboard  — live rates, solar yield, utility breakdown
//   Policy     — VDER, PSC proceedings, interconnection
//   Incentives — NY-Sun, state tax credit, utility programs
//   News       — NY-tagged articles from the live feed
//
// Regulator: NY Public Service Commission (PSC)
// ISO:       NYISO
// NEM type:  VDER (Value of Distributed Energy Resources)
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Sun, FileText, Newspaper,
  CheckCircle, AlertTriangle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────
// STATE CONSTANTS — edit these for NY updates
// ─────────────────────────────────────────
const STATE = {
  abbr: "NY",
  name: "New York",
  iso: "NYISO",
  isoColor: "#2563eb",
};

const UTILITIES = [
  { name: "Con Edison",      territory: "NYC + Westchester",      avg_rate: 29.4, nem: "VDER",     interconnection: "8–14 months" },
  { name: "PSEG Long Island", territory: "Long Island",           avg_rate: 25.8, nem: "VDER",     interconnection: "6–10 months" },
  { name: "National Grid",   territory: "Upstate NY + Brooklyn",  avg_rate: 20.1, nem: "VDER",     interconnection: "9–15 months" },
  { name: "Central Hudson",  territory: "Hudson Valley",          avg_rate: 22.6, nem: "VDER",     interconnection: "6–10 months" },
  { name: "O&R",             territory: "Lower Hudson Valley",    avg_rate: 23.1, nem: "VDER",     interconnection: "6–9 months"  },
];

// VDER = Value of Distributed Energy Resources
// NY replaced traditional NEM with VDER in 2017.
// Credits are a stack of components, not a simple retail rate offset.
const VDER_FACTS = [
  { label: "Energy value",        value: "~$0.03–0.07/kWh",  note: "Wholesale LBMP-based; varies by zone and hour" },
  { label: "Capacity value",      value: "~$0.03–0.06/kWh",  note: "Highest in Con Ed/NYC zone — capacity-constrained" },
  { label: "Environmental value", value: "~$0.03–0.05/kWh",  note: "Pegged to RECs and NY Clean Energy Standard" },
  { label: "LSRV adder",          value: "Up to $0.10/kWh",  note: "Locational System Relief Value — only in qualifying zones" },
  { label: "Monthly billing",     value: "Monthly credits",  note: "No annual true-up; credits applied monthly to bill" },
  { label: "Multifamily pathway", value: "CDG / VDER-CDG",   note: "Community Distributed Generation is the MF route" },
];

// PSC = Public Service Commission (NY's equivalent of CPUC)
const PSC_PROCEEDINGS = [
  {
    docket: "Case 17-E-0409",
    title: "VDER Phase 1 — Value Stack Tariff",
    status: "decided",
    summary: "Established the Value of Distributed Energy Resources (VDER) value stack as NY's NEM successor. Export credits calculated from energy, capacity, environmental, and locational components rather than retail rate offset.",
    last_action: "2017 (ongoing updates)",
    url: "https://www.nyserda.ny.gov/All-Programs/NY-Sun",
  },
  {
    docket: "Case 21-E-0606",
    title: "VDER Phase 2 / NEM Successor Proceeding",
    status: "active",
    summary: "PSC examining enhancements to VDER including paired storage treatment, multifamily CDG expansion, and potential phase-out of legacy NEM for pre-2017 customers. Key for multifamily + BESS project economics.",
    last_action: "Mar 2026",
    url: "https://www.dps.ny.gov",
  },
  {
    docket: "Case 20-E-0197",
    title: "Distributed System Implementation Plan (DSIP)",
    status: "active",
    summary: "Utility-by-utility DSIP filings determine hosting capacity, interconnection queue priority, and DER integration pathways. Con Edison DSIP updated 2025 with new NYC zone capacity maps.",
    last_action: "Jan 2026",
    url: "https://www.dps.ny.gov",
  },
  {
    docket: "Local Law 97 (NYC)",
    title: "NYC Building Emissions Law — LL97 Implementation",
    status: "active",
    summary: "Applies to buildings over 25,000 sq ft in NYC. Carbon intensity limits begin 2024, tighten 2030. Solar + BESS directly reduces reported emissions intensity. Strong demand driver for multifamily DER in the five boroughs.",
    last_action: "Jan 2024 (compliance year 1)",
    url: "https://www.nyc.gov/assets/buildings/html/ll97-of-2019.html",
  },
];

// NY-Sun is NYSERDA's solar incentive — the NY equivalent of SGIP
// Administered as MW Block tranches per utility territory.
const NYSUN_BLOCKS = [
  { category: "Con Ed — Residential",      rate: "$0.20/W", status: "active",   note: "NYC/Westchester. Higher rate reflects high grid rates and LL97 demand." },
  { category: "Con Ed — Small Commercial", rate: "$0.15/W", status: "active",   note: "Systems ≤200 kW. Applies to multifamily common-area and roof systems." },
  { category: "National Grid — Residential", rate: "$0.10/W", status: "waitlist", note: "Upstate blocks nearly full. New tranches announced by NYSERDA periodically." },
  { category: "PSEG Long Island",          rate: "$0.20/W", status: "active",   note: "Long Island. LIPA territory; NY-Sun administered separately via PSEG-LI." },
  { category: "Central Hudson / O&R",      rate: "$0.10/W", status: "active",   note: "Hudson Valley and Lower Hudson. Smaller capacity blocks; check current availability." },
];

const OTHER_INCENTIVES = [
  {
    name: "Federal ITC (Section 48E)",
    value: "30% + 10% DC adder",
    status: "active",
    notes: "Base 30% + 10% domestic content adder if DC requirements met. Prevailing wage required for full credit on systems >1 MW.",
    url: "https://www.irs.gov/credits-deductions/domestic-content-bonus-credit",
  },
  {
    name: "NY State Solar Tax Credit",
    value: "25% — up to $5,000",
    status: "active",
    notes: "Residential only. 25% of qualified solar system cost, capped at $5,000 per taxpayer. Claimed on NY Form IT-255. Does not apply to commercial/multifamily owners directly.",
    url: "https://www.tax.ny.gov/pit/credits/solar_energy_credit.htm",
  },
  {
    name: "NYC Solar Property Tax Abatement (PTA)",
    value: "Up to $62,500/yr",
    status: "active",
    notes: "NYC buildings: abatement on property taxes for qualifying solar systems. Applied over 4 years. Multifamily buildings eligible. Administered by NYC DOF. Significant value stacked with ITC for NYC projects.",
    url: "https://www.nyc.gov/assets/buildings/pdf/solar_panels_info.pdf",
  },
  {
    name: "NYSERDA Clean Energy Fund — Storage",
    value: "Varies by project",
    status: "active",
    notes: "NYSERDA offers project-specific incentives for paired solar+storage under the Clean Energy Fund. Especially active for multifamily affordable housing (low-income solar programs).",
    url: "https://www.nyserda.ny.gov/All-Programs/Clean-Energy-Fund",
  },
  {
    name: "Con Edison BESS Demand Response",
    value: "~$150–300/kW-yr",
    status: "active",
    notes: "Con Ed territory: battery storage enrolled in demand response programs earns annual payments. Value stacks directly with VDER export credits. Strongest economics in NYC peak load zones.",
    url: "https://www.coned.com/en/business-partners/demand-response",
  },
];

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
type Tab = "dashboard" | "policy" | "incentives" | "news";

interface Article {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  published_at: string;
  topic: string;
}

// ─────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active:   "bg-green-500/15 text-green-400 border-green-500/30",
    decided:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
    waitlist: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    closed:   "bg-red-500/15 text-red-400 border-red-500/30",
    pending:  "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${map[status] || map.pending}`}>
      {status}
    </span>
  );
};

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────
export default function NYHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articleTopic, setArticleTopic] = useState<string>("all");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard",  label: "Dashboard",  icon: <Zap className="h-4 w-4" /> },
    { key: "policy",     label: "Policy",     icon: <FileText className="h-4 w-4" /> },
    { key: "incentives", label: "Incentives", icon: <Sun className="h-4 w-4" /> },
    { key: "news",       label: "News",       icon: <Newspaper className="h-4 w-4" /> },
  ];

  // Fetch NY articles when News tab is opened
  useEffect(() => {
    if (tab !== "news") return;
    async function fetchArticles() {
      setArticlesLoading(true);
      let query = supabase
        .from("articles")
        .select("id, title, summary, source_url, source_name, published_at, topic")
        .contains("states", ["NY"])
        .order("published_at", { ascending: false })
        .limit(30);
      if (articleTopic !== "all") {
        const enumVal = topicDisplayToEnum[articleTopic];
        if (enumVal) query = query.eq("topic", enumVal as any);
      }
      const { data } = await query;
      setArticles(data || []);
      setArticlesLoading(false);
    }
    fetchArticles();
  }, [tab, articleTopic]);

  const topicDisplayToEnum: Record<string, string> = {
    "Solar": "solar",
    "Energy Storage": "bess_storage",
    "Policy & Regulation": "policy_incentives",
    "Finance & Incentives": "market_pricing",
    "Grid & Utilities": "technology_equipment",
  };
  const topics = ["all", ...Object.keys(topicDisplayToEnum)];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Page header ── */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/market")}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Market Intelligence</span>
              </button>
              <div className="h-4 w-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-2 py-0.5 font-mono text-xs font-bold"
                  style={{ backgroundColor: STATE.isoColor + "22", color: STATE.isoColor }}
                >
                  {STATE.iso}
                </span>
                <h1 className="text-xl font-bold text-zinc-50">{STATE.name}</h1>
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                  {STATE.abbr}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs text-zinc-600">
              Last verified: Mar 2026
            </span>
          </div>

          {/* Tab bar */}
          <div className="mt-4 flex gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* ══════════════════════════════════════
            DASHBOARD TAB
        ══════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div className="space-y-8">

            {/* Headline numbers */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Avg Residential Rate", value: "~$0.25/kWh", sub: "Weighted avg Con Ed/PSEG-LI/National Grid", color: "text-amber-400" },
                { label: "VDER Export Credit",    value: "~$0.10–0.15/kWh", sub: "Full value stack, Con Ed zone (peak)",  color: "text-blue-400" },
                { label: "NY-Sun Incentive",      value: "$0.20/W",    sub: "Con Ed residential — highest block rate", color: "text-green-400" },
                { label: "Avg Solar Yield",        value: "1,200 kWh/yr", sub: "Per kW installed, 10 kW system (NYC)",  color: "text-yellow-400" },
              ].map((card, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 mb-2">{card.label}</p>
                  <p className={`font-mono text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="mt-1 text-xs text-zinc-600">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Utility breakdown table */}
            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">Utility Breakdown</h2>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-zinc-800 bg-zinc-900/50">
                    <tr>
                      {["Utility", "Territory", "Avg Rate (¢/kWh)", "Export Tariff", "Interconnection Timeline"].map(h => (
                        <th key={h} className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {UTILITIES.map((u, i) => (
                      <tr key={i} className="bg-zinc-900/30 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-bold text-zinc-200">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{u.territory}</td>
                        <td className="px-4 py-3 font-mono text-sm font-bold text-amber-400">{u.avg_rate}</td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">{u.nem}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                            {u.interconnection}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VDER quick facts */}
            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">VDER Value Stack — Quick Facts</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {VDER_FACTS.map((f, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-1">{f.label}</p>
                    <p className="text-sm font-semibold text-amber-400">{f.value}</p>
                    <p className="mt-1 text-xs text-zinc-500">{f.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">VDER vs NEM — what it means for multifamily</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Unlike traditional NEM, VDER credits don't offset retail rate — they pay a calculated value stack. In the Con Ed NYC zone, the full stack (energy + capacity + environmental + LSRV) can reach $0.10–0.15/kWh peak, rivaling NEM in high-rate territories. Paired BESS maximizes export during capacity-constrained hours when the value stack is highest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            POLICY TAB
        ══════════════════════════════════════ */}
        {tab === "policy" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-2">PSC Proceedings &amp; Regulatory Actions</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Active and recently decided proceedings from the NY Public Service Commission
                and NYC agencies affecting DER development. Updated manually when new decisions are issued.
              </p>
              <div className="space-y-4">
                {PSC_PROCEEDINGS.map((p, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-zinc-400">{p.docket}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <h3 className="text-base font-semibold text-zinc-100">{p.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {p.last_action}
                        </span>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 font-mono text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> PSC
                        </a>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{p.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interconnection rules */}
            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">Interconnection by Utility</h2>
              <div className="space-y-3">
                {UTILITIES.map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-zinc-200">{u.name}</p>
                      <p className="text-xs text-zinc-500">{u.territory}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-amber-400 font-semibold">{u.interconnection}</p>
                      <p className="font-mono text-[10px] text-zinc-600">typical timeline</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                  <p className="text-xs text-zinc-500">
                    Systems under 25 kW typically qualify for NY expedited interconnection (Simplified Review). Con Edison's Distributed System Implementation Plan (DSIP) includes hosting capacity maps — check zone-level capacity before project commitment. BESS-only additions to existing PV may qualify for an expedited process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            INCENTIVES TAB
        ══════════════════════════════════════ */}
        {tab === "incentives" && (
          <div className="space-y-8">

            {/* NY-Sun */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-zinc-100">NY-Sun — NYSERDA Solar Incentive Program</h2>
                <StatusBadge status="active" />
              </div>
              <p className="text-sm text-zinc-500 mb-4">
                NY's primary solar incentive, administered by NYSERDA as per-watt MW Block tranches
                by utility territory. Rates decline as blocks fill. Con Edison territory offers the
                highest current rates due to high grid costs and LL97 compliance demand.
              </p>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-zinc-800 bg-zinc-900/50">
                    <tr>
                      {["Territory / Category", "Rate", "Status", "Notes"].map(h => (
                        <th key={h} className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {NYSUN_BLOCKS.map((s, i) => (
                      <tr key={i} className="bg-zinc-900/30 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-zinc-200">{s.category}</td>
                        <td className="px-4 py-3 font-mono text-sm font-bold text-amber-400">{s.rate}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{s.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <a
                  href="https://www.nyserda.ny.gov/All-Programs/NY-Sun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> nyserda.ny.gov/NY-Sun — official program portal
                </a>
              </div>
            </div>

            {/* Other incentives */}
            <div>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">Other Programs</h2>
              <div className="space-y-4">
                {OTHER_INCENTIVES.map((inc, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-200">{inc.name}</p>
                        <StatusBadge status={inc.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">{inc.value}</span>
                        <a
                          href={inc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{inc.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            NEWS TAB
        ══════════════════════════════════════ */}
        {tab === "news" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">New York News</h2>
                <p className="text-sm text-zinc-500">Articles tagged New York from the live feed.</p>
              </div>
              {/* Topic filter */}
              <div className="flex flex-wrap gap-2">
                {topics.map(t => (
                  <button
                    key={t}
                    onClick={() => setArticleTopic(t)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      articleTopic === t
                        ? "border-transparent bg-amber-500/20 text-amber-400"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t === "all" ? "All topics" : t}
                  </button>
                ))}
              </div>
            </div>

            {articlesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-800/50" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-6 py-16 text-center">
                <Newspaper className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No New York articles yet.</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Articles get tagged automatically after the next issue runs with the updated fetch function.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map(a => (
                  <a
                    key={a.id}
                    href={a.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-amber-500/30 hover:bg-zinc-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                          {a.topic}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-600">
                          {new Date(a.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-amber-400 transition-colors line-clamp-2">
                        {a.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{a.summary}</p>
                      <p className="mt-1.5 font-mono text-[10px] text-zinc-600">{a.source_name}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-700 group-hover:text-amber-400 transition-colors mt-1" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
