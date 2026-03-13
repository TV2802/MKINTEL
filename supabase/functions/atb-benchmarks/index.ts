import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Metrics we want to extract — key = display name, match = CSV filter criteria
const WANTED_METRICS = [
  {
    displayName: "Residential PV CAPEX",
    unit: "$/kWDC",
    techFilter: "Residential PV",
    metricFilter: "CAPEX",
    detailFilter: "$/kWDC",
  },
  {
    displayName: "Residential Battery Storage CAPEX ($/kWDC)",
    unit: "$/kWDC",
    techFilter: "Residential Battery Storage",
    metricFilter: "CAPEX",
    detailFilter: "$/kWDC",
  },
  {
    displayName: "Residential Battery Storage CAPEX ($/kWh)",
    unit: "$/kWh",
    techFilter: "Residential Battery Storage",
    metricFilter: "CAPEX",
    detailFilter: "$/kWh",
  },
  {
    displayName: "Commercial PV CAPEX",
    unit: "$/kWDC",
    techFilter: "Commercial PV",
    metricFilter: "CAPEX",
    detailFilter: "$/kWDC",
  },
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Check cache freshness — skip fetch if data is < 30 days old
    const { data: cached } = await sb
      .from("atb_cache")
      .select("*")
      .eq("atb_year", 2024)
      .eq("scenario", "Moderate")
      .limit(1);

    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    if (cached && cached.length > 0) {
      const age = now - new Date(cached[0].fetched_at).getTime();
      if (age < THIRTY_DAYS) {
        // Return cached data and still upsert market_metrics (idempotent)
        const { data: allCached } = await sb
          .from("atb_cache")
          .select("*")
          .eq("atb_year", 2024)
          .eq("scenario", "Moderate");

        const metrics = (allCached ?? []).map((r) => ({
          metric_name: r.metric_name,
          value: r.value,
          unit: r.unit,
          scenario: r.scenario,
          atb_year: r.atb_year,
          fetched_at: r.fetched_at,
        }));

        return new Response(
          JSON.stringify({ metrics, source: "cache", fetched_at: cached[0].fetched_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch the ATB summary CSV
    const csvUrl =
      "https://oedi-data-lake.s3.amazonaws.com/ATB/electricity/csv/2024/ATBe_2024_summary.csv";
    const csvRes = await fetch(csvUrl);
    if (!csvRes.ok) {
      throw new Error(`Failed to fetch ATB CSV: ${csvRes.status}`);
    }
    const csvText = await csvRes.text();
    const rows = parseCSV(csvText);

    console.log(`Parsed ${rows.length} CSV rows. Sample headers: ${Object.keys(rows[0] ?? {}).join(", ")}`);

    // Extract wanted metrics
    const extracted: { displayName: string; value: number; unit: string }[] = [];

    for (const wanted of WANTED_METRICS) {
      // Try to find matching row — CSV column names vary, so we do case-insensitive partial matching
      const match = rows.find((r) => {
        const tech = (r["technology"] || r["Technology"] || r["tech"] || "").toLowerCase();
        const metric = (r["core_metric_parameter"] || r["Metric"] || r["metric"] || r["parameter"] || "").toLowerCase();
        const detail = (r["core_metric_detail"] || r["Detail"] || r["detail"] || r["units"] || r["Units"] || "").toLowerCase();
        const scenario = (r["scenario"] || r["Scenario"] || "").toLowerCase();
        const year = r["core_metric_year"] || r["Year"] || r["year"] || "";

        return (
          tech.includes(wanted.techFilter.toLowerCase()) &&
          metric.includes(wanted.metricFilter.toLowerCase()) &&
          detail.includes(wanted.detailFilter.toLowerCase()) &&
          scenario.includes("moderate") &&
          year === "2024"
        );
      });

      if (match) {
        const val = parseFloat(match["value"] || match["Value"] || "0");
        extracted.push({ displayName: wanted.displayName, value: val, unit: wanted.unit });
      } else {
        console.warn(`No CSV match for: ${wanted.displayName}`);
      }
    }

    console.log(`Extracted ${extracted.length} metrics`);

    const fetchedAt = new Date().toISOString();

    // Upsert into atb_cache
    for (const m of extracted) {
      await sb.from("atb_cache").upsert(
        {
          metric_name: m.displayName,
          value: m.value,
          unit: m.unit,
          scenario: "Moderate",
          atb_year: 2024,
          fetched_at: fetchedAt,
        },
        { onConflict: "metric_name,scenario,atb_year" }
      );
    }

    // Upsert into market_metrics so they appear in Weekly Benchmarks
    for (const m of extracted) {
      await sb.from("market_metrics").upsert(
        {
          metric_name: m.displayName,
          value: m.value,
          unit: m.unit,
          trend: "neutral",
          notes: "NREL ATB 2024",
          updated_at: fetchedAt,
        },
        { onConflict: "metric_name" }
      );
    }

    const metrics = extracted.map((m) => ({
      metric_name: m.displayName,
      value: m.value,
      unit: m.unit,
      scenario: "Moderate",
      atb_year: 2024,
      fetched_at: fetchedAt,
    }));

    return new Response(
      JSON.stringify({ metrics, source: "fresh", fetched_at: fetchedAt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ATB fetch error:", error);
    return new Response(
      JSON.stringify({ metrics: [], error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
