import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedSource {
  url: string;
  name: string;
  topics: string[];
}

const FEEDS: FeedSource[] = [
  { url: "https://www.solarpowerworldonline.com/feed/", name: "Solar Power World", topics: ["solar"] },
  { url: "https://cleantechnica.com/feed/", name: "CleanTechnica", topics: ["solar", "battery", "new_innovations"] },
  { url: "https://www.utilitydive.com/feeds/news/", name: "Utility Dive", topics: ["built_environment", "solar", "battery"] },
  { url: "https://electrek.co/feed/", name: "Electrek", topics: ["battery", "new_innovations"] },
  { url: "https://www.greentechmedia.com/feed", name: "GreenTech Media", topics: ["solar", "battery", "new_innovations"] },
  { url: "https://www.energy.gov/eere/articles.xml", name: "DOE EERE", topics: ["built_environment", "new_innovations"] },
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  solar: ["solar", "photovoltaic", "pv", "sun", "panel"],
  multifamily: ["multifamily", "apartment", "housing", "residential", "tenant", "building efficiency"],
  battery: ["battery", "storage", "lithium", "energy storage", "ev", "electric vehicle"],
  built_environment: ["building", "retrofit", "hvac", "insulation", "energy efficiency", "built environment", "weatherization"],
  new_innovations: ["innovation", "breakthrough", "new technology", "hydrogen", "fusion", "startup"],
  company_success: ["company", "growth", "revenue", "partnership", "acquisition", "funding", "ipo"],
};

function categorize(title: string, summary: string, feedTopics: string[]): string {
  const text = `${title} ${summary}`.toLowerCase();
  let bestTopic = feedTopics[0] || "new_innovations";
  let bestScore = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (feedTopics.includes(topic)) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

function extractText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim().replace(/<[^>]+>/g, "").trim() : "";
}

function extractImage(itemXml: string): string | null {
  // Check media:content
  const mediaMatch = itemXml.match(/url="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
  if (mediaMatch) return mediaMatch[1];
  // Check enclosure
  const encMatch = itemXml.match(/<enclosure[^>]+url="(https?:\/\/[^"]+)"/i);
  if (encMatch) return encMatch[1];
  // Check img in description
  const imgMatch = itemXml.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

async function fetchFeed(feed: FeedSource): Promise<Array<{
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  image_url: string | null;
  topic: string;
  published_at: string | null;
}>> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "EnergyPulse/1.0" },
    });
    if (!res.ok) {
      console.error(`Failed to fetch ${feed.url}: ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const items = xml.split(/<item[\s>]/i).slice(1);

    return items.slice(0, 10).map((itemXml) => {
      const title = extractText(itemXml, "title");
      const description = extractText(itemXml, "description");
      const link = extractText(itemXml, "link") || itemXml.match(/<link[^>]*>(.*?)<\/link>/)?.[1]?.trim() || "";
      const pubDate = extractText(itemXml, "pubDate");
      const image = extractImage(itemXml);
      const topic = categorize(title, description, feed.topics);

      return {
        title,
        summary: description.slice(0, 500),
        source_url: link,
        source_name: feed.name,
        image_url: image,
        topic,
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
      };
    }).filter((a) => a.title && a.source_url);
  } catch (e) {
    console.error(`Error fetching ${feed.url}:`, e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine issue number
    const { data: lastIssue } = await supabase
      .from("issues")
      .select("issue_number")
      .order("issue_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const issueNumber = (lastIssue?.issue_number ?? 0) + 1;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Create new issue
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .insert({
        issue_number: issueNumber,
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (issueError) throw issueError;

    // Fetch all feeds in parallel
    const allArticles = (await Promise.all(FEEDS.map(fetchFeed))).flat();

    // Dedupe by URL
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      if (seen.has(a.source_url)) return false;
      seen.add(a.source_url);
      return true;
    });

    // Mark the first article with an image as featured
    const featuredIdx = unique.findIndex((a) => a.image_url);
    
    const toInsert = unique.map((a, i) => ({
      ...a,
      issue_id: issue.id,
      is_featured: i === featuredIdx,
    }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("articles")
        .insert(toInsert);
      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        issue_number: issueNumber,
        articles_count: toInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
