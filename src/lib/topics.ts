import type { Database } from "@/integrations/supabase/types";

type TopicCategory = Database["public"]["Enums"]["topic_category"];

export interface TopicConfig {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const TOPIC_CONFIG: Record<TopicCategory, TopicConfig> = {
  solar: {
    label: "Solar",
    colorClass: "text-energy-solar",
    bgClass: "bg-energy-solar",
    borderClass: "border-energy-solar",
  },
  multifamily: {
    label: "Multifamily",
    colorClass: "text-energy-multifamily",
    bgClass: "bg-energy-multifamily",
    borderClass: "border-energy-multifamily",
  },
  battery: {
    label: "Battery",
    colorClass: "text-energy-battery",
    bgClass: "bg-energy-battery",
    borderClass: "border-energy-battery",
  },
  built_environment: {
    label: "Built Environment",
    colorClass: "text-energy-building",
    bgClass: "bg-energy-building",
    borderClass: "border-energy-building",
  },
  new_innovations: {
    label: "New Innovations",
    colorClass: "text-energy-innovation",
    bgClass: "bg-energy-innovation",
    borderClass: "border-energy-innovation",
  },
  company_success: {
    label: "Success Stories",
    colorClass: "text-energy-success",
    bgClass: "bg-energy-success",
    borderClass: "border-energy-success",
  },
};

export const ALL_TOPICS = Object.keys(TOPIC_CONFIG) as TopicCategory[];
