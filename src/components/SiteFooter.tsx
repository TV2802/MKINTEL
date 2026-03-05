import { Zap } from "lucide-react";
import { TOPIC_CONFIG, ALL_TOPICS } from "@/lib/topics";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold">Energy Pulse</span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your weekly curated briefing on the energy &amp; sustainability
              landscape. Auto-aggregated from top industry sources.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {ALL_TOPICS.map((t) => (
                <span
                  key={t}
                  className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${TOPIC_CONFIG[t].bgClass} text-primary-foreground`}
                >
                  {TOPIC_CONFIG[t].label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Energy Pulse. Powered by Lovable.
        </div>
      </div>
    </footer>
  );
}
