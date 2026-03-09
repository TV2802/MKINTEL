import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EIARecord {
  period: string;
  stateid: string;
  stateDescription: string;
  sectorName: string;
  price: number;
}

interface EIAResponse {
  response: {
    data: EIARecord[];
  };
}

const STATE_NAMES: Record<string, string> = {
  CA: "California",
  NY: "New York",
  TX: "Texas",
  MA: "Massachusetts",
  NJ: "New Jersey",
  CO: "Colorado",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("EIA_API_KEY");
    if (!apiKey) {
      throw new Error("EIA_API_KEY not configured");
    }

    const url = `https://api.eia.gov/v2/electricity/retail-sales/data/?api_key=${apiKey}&frequency=monthly&data[0]=price&facets[sectorName][]=all&facets[stateid][]=CA&facets[stateid][]=NY&facets[stateid][]=TX&facets[stateid][]=MA&facets[stateid][]=NJ&facets[stateid][]=CO&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=12`;

    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`EIA API error: ${res.status} - ${errorText}`);
    }

    const json: EIAResponse = await res.json();
    const data = json.response?.data ?? [];
    
    // Filter for residential in the response data
    const residentialData = data.filter(r => r.sectorName?.toLowerCase() === 'residential');

    // Group by state and get latest 2 periods per state for trend calculation
    const byState: Record<string, EIARecord[]> = {};
    for (const record of residentialData) {
      if (!byState[record.stateid]) {
        byState[record.stateid] = [];
      }
      if (byState[record.stateid].length < 2) {
        byState[record.stateid].push(record);
      }
    }

    const stateRates = Object.entries(byState).map(([stateId, records]) => {
      const current = records[0];
      const previous = records[1];
      let trend: "up" | "down" | "neutral" = "neutral";
      if (current && previous) {
        if (current.price > previous.price) trend = "up";
        else if (current.price < previous.price) trend = "down";
      }
      return {
        stateId,
        stateName: STATE_NAMES[stateId] || stateId,
        price: current?.price ?? null,
        period: current?.period ?? "Data unavailable",
        trend,
      };
    });

    // Fill in missing states if any
    const finalRates = Object.entries(STATE_NAMES).map(([stateId, stateName]) => {
      const existing = stateRates.find(r => r.stateId === stateId);
      if (existing) return existing;
      return {
        stateId,
        stateName,
        price: null,
        period: "Data unavailable",
        trend: "neutral" as const,
      };
    });

    // Sort by state name for consistent ordering
    finalRates.sort((a, b) => a.stateName.localeCompare(b.stateName));

    return new Response(JSON.stringify({ rates: finalRates, fetched_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("EIA fetch error:", error);
    
    // Fallback response instead of 500 error to gracefully handle UI
    const fallbackRates = Object.entries(STATE_NAMES).map(([stateId, stateName]) => ({
      stateId,
      stateName,
      price: null,
      period: "Data unavailable",
      trend: "neutral" as const
    }));
    
    fallbackRates.sort((a, b) => a.stateName.localeCompare(b.stateName));

    return new Response(JSON.stringify({ rates: fallbackRates, fetched_at: null, error: error.message }), {
      status: 200, // Keep 200 so frontend doesn't crash on parse
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
