import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Get started — Vemee",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your Vemee account"
      subtitle="Tell us a little about you, then verify your mobile number."
      wide
      footer={
        <>
          Already have an account? <Link href="/login">Log in</Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}