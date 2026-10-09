import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Vemee",
};

/**
 * Privacy Policy for signup acceptance.
 */
export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="6 October 2026">
      <p>
        This Privacy Policy explains how Vemee collects, uses, and protects your
        information when you use our app and website.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Account details such as name, email, phone number, and gender.</li>
        <li>Profile details you choose to add (bio, city, interests).</li>
        <li>Plan activity, connections, and chat messages you send.</li>
        <li>Approximate location when you allow it for nearby discovery.</li>
        <li>Device and usage data needed to run and improve the service.</li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Create and secure your account.</li>
        <li>Show plans, people, and chats relevant to you.</li>
        <li>Support safety features like report and block.</li>
        <li>Improve product performance and reliability.</li>
        <li>Contact you about important account or service updates.</li>
      </ul>

      <h2>3. Sharing</h2>
      <p>
        We do not sell your personal information. We may share data with service
        providers who help us operate Vemee (for example hosting and messaging),
        or when required by law.
      </p>

      <h2>4. Your choices</h2>
      <p>
        You can update profile details in the app, control location permission
        on your device, and request account deletion by contacting us.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep information while your account is active and as needed for
        legal, safety, and operational purposes. When you delete your account,
        we remove or anonymize personal data where we are not required to keep
        it.
      </p>

      <h2>6. Security</h2>
      <p>
        We use reasonable safeguards to protect your data. No method of
        transmission or storage is completely secure, so please protect your
        device and OTP codes.
      </p>

      <h2>7. Children</h2>
      <p>
        Vemee is for adults 18+. We do not knowingly collect information from
        children.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this Privacy Policy. We will post the latest version on
        this page with an updated date.
      </p>

      <h2>9. Contact</h2>
      <p>
        Privacy questions? Email{" "}
        <a href="mailto:privacy@vemee.app">privacy@vemee.app</a>.
      </p>
    </LegalShell>
  );
}
