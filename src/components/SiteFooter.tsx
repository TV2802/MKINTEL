import { Zap, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold tracking-tight">PULSE</span>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Internal weekly briefing for DER developers, owners, and operators
              in the multifamily housing sector. Solar PV &amp; BESS intelligence.
            </p>
          </div>

          {/* Signal strip */}
          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Live signals across
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl font-black tracking-tighter text-primary md:text-6xl">
                50
              </span>
              <span className="font-mono text-xs text-muted-foreground">states</span>
              <span className="mx-2 text-muted-foreground/40">·</span>
              <span className="font-display text-5xl font-black tracking-tighter text-primary md:text-6xl">
                6
              </span>
              <span className="font-mono text-xs text-muted-foreground">verticals</span>
            </div>
            <a
              href="/articles"
              className="group flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Explore the feed
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PULSE. Powered by Lovable.
        </div>
      </div>
    </footer>
  );
}
