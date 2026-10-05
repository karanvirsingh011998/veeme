import { requireAdmin } from "@/lib/admin/auth";
import {
  formatMoney,
  getRevenueSummary,
  listAdminPayments,
} from "@/lib/admin/revenue";
import styles from "./revenue.module.css";

export const metadata = {
  title: "Revenue — Vemee Admin",
};

/**
 * Admin revenue tab — payment totals and transaction list.
 */
export default async function AdminRevenuePage() {
  await requireAdmin();
  const payments = await listAdminPayments();
  const summary = await getRevenueSummary(payments);

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Finance</p>
      <h1 className={styles.title}>Revenue</h1>
      <p className={styles.copy}>
        Payment activity across bookings. Totals update as payments are
        captured.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Captured</p>
          <p className={styles.statValue}>
            {formatMoney(summary.totalCapturedCents, summary.currency)}
          </p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Pending</p>
          <p className={styles.statValue}>
            {formatMoney(summary.totalPendingCents, summary.currency)}
          </p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Failed</p>
          <p className={styles.statValue}>
            {formatMoney(summary.totalFailedCents, summary.currency)}
          </p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Payments</p>
          <p className={styles.statValue}>{summary.paymentCount}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className={styles.empty}>
          <p>No payment records yet.</p>
          <p className={styles.hint}>
            Revenue appears here once bookings produce payments in Supabase.
            Requires `SUPABASE_SERVICE_ROLE_KEY` for admin reads.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Booking</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.created_at).toLocaleString()}</td>
                  <td>
                    <div className={styles.payer}>
                      <strong>{payment.payer_name || "Unknown"}</strong>
                      <span>{payment.payer_email || payment.payer_id}</span>
                    </div>
                  </td>
                  <td>
                    {formatMoney(payment.amount_cents, payment.currency)}
                  </td>
                  <td>{payment.method}</td>
                  <td>
                    <span className={styles.badge}>{payment.status}</span>
                  </td>
                  <td className={styles.mono}>
                    {payment.booking_id.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
