export type MomentAudience = "individual" | "community";

export type MomentComment = {
  id: string;
  momentId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Moment = {
  id: string;
  authorId: string;
  authorName: string;
  audience: MomentAudience;
  communityId: string | null;
  communityName: string | null;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  createdAt: string;
};

export type CreateMomentInput = {
  authorId: string;
  authorName: string;
  audience: MomentAudience;
  communityId?: string | null;
  body: string;
  imageUrl?: string | null;
};
