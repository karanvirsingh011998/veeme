import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms & Conditions — Vemee",
};

/**
 * Terms & Conditions for signup acceptance.
 */
export default function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="6 October 2026">
      <p>
        Welcome to Vemee. By creating an account or using the app, you agree to
        these Terms &amp; Conditions. If you do not agree, please do not use
        Vemee.
      </p>

      <h2>1. What Vemee is</h2>
      <p>
        Vemee helps people discover and join real-world plans and activities
        with others who share common interests. Vemee is not a dating service.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and able to form a binding agreement
        to use Vemee. You are responsible for keeping your account details
        accurate and secure.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>Provide truthful profile information.</li>
        <li>Do not share your account or OTP codes with others.</li>
        <li>You are responsible for activity under your account.</li>
      </ul>

      <h2>4. Community conduct</h2>
      <p>
        Treat other members with respect. Do not harass, scam, spam, or post
        harmful content. Plans should be genuine activity invitations — not
        misleading offers.
      </p>

      <h2>5. Safety</h2>
      <p>
        Meetups happen in the real world. Use good judgment, meet in public
        places when possible, and use in-app report/block tools if needed.
        Vemee does not guarantee the behavior of other members.
      </p>

      <h2>6. Content and plans</h2>
      <p>
        You keep ownership of content you post. You grant Vemee a license to
        host and display that content so the service can operate. We may remove
        content that violates these terms.
      </p>

      <h2>7. Termination</h2>
      <p>
        We may suspend or end accounts that break these terms or create safety
        risks. You may stop using Vemee at any time.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these terms from time to time. Continued use after changes
        means you accept the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms? Reach us at{" "}
        <a href="mailto:hello@vemee.app">hello@vemee.app</a>.
      </p>
    </LegalShell>
  );
}
