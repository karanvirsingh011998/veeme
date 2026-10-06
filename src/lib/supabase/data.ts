import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/auth/config";

/**
 * True when plans/chat should use Supabase (URL + service role).
 */
export function canUseSupabaseData(): boolean {
  return isSupabaseConfigured() && isServiceRoleConfigured();
}

type AnyBuilder = {
  select: (cols?: string, opts?: object) => AnyBuilder;
  insert: (row: unknown) => AnyBuilder;
  update: (row: unknown) => AnyBuilder;
  upsert: (row: unknown, opts?: object) => AnyBuilder;
  delete: () => AnyBuilder;
  eq: (col: string, value: unknown) => AnyBuilder;
  in: (col: string, values: unknown[]) => AnyBuilder;
  or: (expr: string) => AnyBuilder;
  order: (col: string, opts?: object) => AnyBuilder;
  limit: (n: number) => AnyBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
  then: Promise<{ data: unknown; error: { message: string } | null; count?: number | null }>["then"];
};

/**
 * Untyped service-role client for tables outside the narrow Database typing.
 */
export function getDataClient(): { from: (table: string) => AnyBuilder } | null {
  if (!canUseSupabaseData()) return null;
  const client = createServiceClient();
  if (!client) return null;
  return client as unknown as { from: (table: string) => AnyBuilder };
}
