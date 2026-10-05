import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/auth/config";

export type AdminPaymentRow = {
  id: string;
  booking_id: string;
  payer_id: string;
  amount_cents: number;
  currency: string;
  method: string;
  status: string;
  provider: string | null;
  provider_payment_id: string | null;
  created_at: string;
  payer_email?: string | null;
  payer_name?: string | null;
};

export type RevenueSummary = {
  totalCapturedCents: number;
  totalPendingCents: number;
  totalFailedCents: number;
  paymentCount: number;
  currency: string;
};

type AnyClient = {
  from: (table: string) => {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => {
        limit: (n: number) => Promise<{
          data: AdminPaymentRow[] | null;
          error: unknown;
        }>;
      };
    };
  };
};

/**
 * Aggregates payment totals for the admin revenue dashboard.
 */
export async function getRevenueSummary(
  payments?: AdminPaymentRow[],
): Promise<RevenueSummary> {
  const rows = payments ?? (await listAdminPayments());
  const currency = rows[0]?.currency || "INR";

  return rows.reduce<RevenueSummary>(
    (acc, payment) => {
      acc.paymentCount += 1;
      if (payment.status === "captured" || payment.status === "succeeded") {
        acc.totalCapturedCents += payment.amount_cents;
      } else if (payment.status === "pending") {
        acc.totalPendingCents += payment.amount_cents;
      } else if (payment.status === "failed") {
        acc.totalFailedCents += payment.amount_cents;
      }
      return acc;
    },
    {
      totalCapturedCents: 0,
      totalPendingCents: 0,
      totalFailedCents: 0,
      paymentCount: 0,
      currency,
    },
  );
}

/**
 * Lists recent payments for admin revenue oversight (service role).
 */
export async function listAdminPayments(): Promise<AdminPaymentRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as unknown as AnyClient)
    .from("payments")
    .select(
      "id, booking_id, payer_id, amount_cents, currency, method, status, provider, provider_payment_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const payerIds = [...new Set(data.map((p) => p.payer_id).filter(Boolean))];
  if (payerIds.length === 0) return data;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, display_name")
    .in("id", payerIds);

  const byId = new Map(
    (profiles || []).map((p) => [
      p.id,
      {
        email: p.email,
        name:
          [p.first_name, p.last_name].filter(Boolean).join(" ") ||
          p.display_name ||
          null,
      },
    ]),
  );

  return data.map((payment) => {
    const payer = byId.get(payment.payer_id);
    return {
      ...payment,
      payer_email: payer?.email ?? null,
      payer_name: payer?.name ?? null,
    };
  });
}

/**
 * Formats cents as localized currency for admin UI.
 */
export function formatMoney(cents: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(0)}`;
  }
}
