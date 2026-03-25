import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Check, X } from "lucide-react";

const FILTER_GROUPS = [
  { label: "All", tags: [] },
  { label: "Solar + BESS", tags: ["Solar", "BESS"] },
  { label: "Policy & Incentives", tags: ["Policy", "Incentives", "ITC", "NEM", "Federal"] },
  { label: "Grid & Utilities", tags: ["Grid", "Utilities", "Interconnection", "VPP"] },
  { label: "Multifamily", tags: ["Multifamily", "Residential"] },
] as const;

const MY_MARKETS = ["CA", "NY", "TX", "MA", "NJ", "CO"];

const ALL_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const STATE_ABBR_TO_TAG: Record<string, string> = {
  CA: "California", NY: "New York", TX: "Texas",
  MA: "Massachusetts", NJ: "New Jersey", CO: "Colorado",
};

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

interface TagFilterBarProps {
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  onClear: () => void;
  availableTags?: string[];
  activeStates: string[];
  onStateToggle: (state: string) => void;
}

function StateChip({ abbr, onRemove }: { abbr: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[10px] font-medium text-primary">
      {abbr}
      <button onClick={onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

export function TagFilterBar({ activeTags, onTagToggle, onClear, activeStates, onStateToggle }: TagFilterBarProps) {
  const [statesOpen, setStatesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeGroup = FILTER_GROUPS.find(
    (g) => g.tags.length > 0 && g.tags.every((t) => activeTags.includes(t)) && activeTags.length === g.tags.length
  );

  const otherStates = ALL_STATES.filter((s) => !MY_MARKETS.includes(s));

  return (
    <div className="sticky top-14 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 py-3 scrollbar-hide">
          {FILTER_GROUPS.map((group) => {
            const isAll = group.tags.length === 0;
            const isActive = isAll
              ? activeTags.length === 0 && activeStates.length === 0
              : activeGroup?.label === group.label;

            return (
              <button
                key={group.label}
                onClick={() => {
                  if (isAll) {
                    onClear();
                  } else {
                    onClear();
                    group.tags.forEach((t) => onTagToggle(t));
                  }
                }}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 font-mono text-[11px] font-medium tracking-wider transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                    : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {group.label}
              </button>
            );
          })}

          {/* States dropdown */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setStatesOpen(!statesOpen)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[11px] font-medium tracking-wider transition-all duration-200 ${
                activeStates.length > 0
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                  : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <MapPin className="h-3 w-3" />
              {activeStates.length > 0 ? `States (${activeStates.length})` : "States"}
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${statesOpen ? "rotate-180" : ""}`} />
            </button>

            {statesOpen && (
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={() => setStatesOpen(false)} />

                {/* Dropdown panel */}
                <div className="absolute right-0 top-full mt-3 z-50 w-[340px] rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-mono text-xs font-semibold tracking-wide text-foreground">
                      Filter by State
                    </span>
                    {activeStates.length > 0 && (
                      <button
                        onClick={() => activeStates.forEach((s) => onStateToggle(s))}
                        className="font-mono text-[10px] text-primary hover:text-primary/80 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Selected chips */}
                  {activeStates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-border/50 bg-muted/30">
                      {activeStates.map((st) => (
                        <StateChip key={st} abbr={st} onRemove={() => onStateToggle(st)} />
                      ))}
                    </div>
                  )}

                  <div className="max-h-[360px] overflow-y-auto overscroll-contain">
                    {/* My Markets */}
                    <div className="px-4 py-2 bg-muted/20">
                      <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                        My Markets
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-border/30">
                      {MY_MARKETS.map((st) => {
                        const selected = activeStates.includes(st);
                        return (
                          <button
                            key={st}
                            onClick={() => onStateToggle(st)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                              selected
                                ? "bg-primary/10 text-foreground"
                                : "bg-popover text-popover-foreground hover:bg-muted/50"
                            }`}
                          >
                            <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                              selected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                            </div>
                            <span className="font-mono text-xs font-medium">{st}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{STATE_NAMES[st]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* All States */}
                    <div className="px-4 py-2 bg-muted/20 border-t border-border/50">
                      <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                        All States
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-border/30">
                      {otherStates.map((st) => {
                        const selected = activeStates.includes(st);
                        return (
                          <button
                            key={st}
                            onClick={() => onStateToggle(st)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                              selected
                                ? "bg-primary/10 text-foreground"
                                : "bg-popover text-popover-foreground hover:bg-muted/50"
                            }`}
                          >
                            <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                              selected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                            </div>
                            <span className="font-mono text-xs font-medium">{st}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{STATE_NAMES[st]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Inline selected state chips on filter bar */}
          {activeStates.length > 0 && !statesOpen && (
            <div className="flex items-center gap-1.5 ml-1">
              {activeStates.slice(0, 3).map((st) => (
                <StateChip key={st} abbr={st} onRemove={() => onStateToggle(st)} />
              ))}
              {activeStates.length > 3 && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  +{activeStates.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { STATE_ABBR_TO_TAG, STATE_NAMES };
