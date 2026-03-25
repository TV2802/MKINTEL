import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";

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
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
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
                    // Set activeTags to exactly this group's tags
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
              <ChevronDown className={`h-3 w-3 transition-transform ${statesOpen ? "rotate-180" : ""}`} />
            </button>

            {statesOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover shadow-xl z-50 max-h-80 overflow-y-auto">
                {/* My Markets */}
                <div className="px-3 py-2 border-b border-border">
                  <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                    My Markets
                  </span>
                </div>
                {MY_MARKETS.map((st) => (
                  <button
                    key={st}
                    onClick={() => onStateToggle(st)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-popover-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-mono text-xs">
                      {st} — {STATE_NAMES[st]}
                    </span>
                    {activeStates.includes(st) && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}

                {/* All Other States */}
                <div className="px-3 py-2 border-t border-b border-border">
                  <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                    All States
                  </span>
                </div>
                {otherStates.map((st) => (
                  <button
                    key={st}
                    onClick={() => onStateToggle(st)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-popover-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-mono text-xs">
                      {st} — {STATE_NAMES[st]}
                    </span>
                    {activeStates.includes(st) && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { STATE_ABBR_TO_TAG, STATE_NAMES };
