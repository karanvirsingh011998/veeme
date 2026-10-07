export const MEMBERSHIP_KEYS = [
  "free",
  "pro",
  "ultra_pro",
  "ultra_promax",
] as const;

export type MembershipKey = (typeof MEMBERSHIP_KEYS)[number];

export type MembershipFeatures = {
  tagline: string;
  highlights: string[];
};

export type MembershipPlan = {
  key: MembershipKey;
  name: string;
  pricePaise: number;
  currency: string;
  sortOrder: number;
  features: MembershipFeatures;
};

export function isMembershipKey(value: unknown): value is MembershipKey {
  return (
    value === "free" ||
    value === "pro" ||
    value === "ultra_pro" ||
    value === "ultra_promax"
  );
}

/** Used when the membership_plans table is not applied yet. */
export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    key: "free",
    name: "Free",
    pricePaise: 0,
    currency: "INR",
    sortOrder: 1,
    features: {
      tagline: "Included with every account",
      highlights: [
        "Create and join activity plans",
        "Chat with people you connect with",
        "People recommendations",
      ],
    },
  },
  {
    key: "pro",
    name: "Pro",
    pricePaise: 19900,
    currency: "INR",
    sortOrder: 2,
    features: {
      tagline: "For people who host often",
      highlights: [
        "Everything in Free",
        "Create more plans each month",
        "Pro badge on your profile",
      ],
    },
  },
  {
    key: "ultra_pro",
    name: "Ultra Pro",
    pricePaise: 29900,
    currency: "INR",
    sortOrder: 3,
    features: {
      tagline: "More reach for your plans",
      highlights: [
        "Everything in Pro",
        "Higher placement in suggestions",
        "Ultra Pro badge on your profile",
      ],
    },
  },
  {
    key: "ultra_promax",
    name: "Ultra Promax",
    pricePaise: 49900,
    currency: "INR",
    sortOrder: 4,
    features: {
      tagline: "The highest membership",
      highlights: [
        "Everything in Ultra Pro",
        "Top placement for your plans",
        "Ultra Promax badge on your profile",
      ],
    },
  },
];

export function formatMembershipPrice(pricePaise: number): string {
  const rupees = pricePaise / 100;
  return `₹${rupees.toLocaleString("en-IN")}`;
}
