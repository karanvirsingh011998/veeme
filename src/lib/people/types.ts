/**
 * Public member card returned by /api/people.
 */
export type PublicProfileDto = {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  verified: boolean;
  interests: string[];
};
