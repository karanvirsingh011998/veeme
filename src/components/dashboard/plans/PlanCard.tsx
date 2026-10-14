"use client";

import { memo } from "react";
import type { PlanWithMeta } from "@/lib/plans/service";
import { HomePlanCard } from "@/components/dashboard/home/HomePlanCard";

type PlanCardProps = {
  plan: PlanWithMeta;
  viewerId?: string;
  onJoin?: (planId: string) => void;
  joining?: boolean;
  joined?: boolean;
};

/**
 * Explore listing uses the same plan card as Discover.
 */
export const PlanCard = memo(function PlanCard({
  plan,
  viewerId,
  onJoin,
  joining,
  joined,
}: PlanCardProps) {
  return (
    <HomePlanCard
      plan={plan}
      viewerId={viewerId}
      joined={joined}
      joining={joining}
      hideSave
      onJoin={onJoin}
    />
  );
});
