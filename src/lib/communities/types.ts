export const COMMUNITY_ICONS = ["👥", "🥾", "🏋️", "🍜", "☕", "🌿", "🎮", "🎨"] as const;

export type CommunityIcon = (typeof COMMUNITY_ICONS)[number];

export type OwnedCommunity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  creatorId: string;
  memberCount: number;
  createdAt: string;
};

export type CreateCommunityInput = {
  creatorId: string;
  name: string;
  description: string;
  icon: string;
};
