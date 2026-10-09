import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";

export const metadata = {
  title: "Get started — Vemee",
};

export default function SignupPage() {
  return (
    <RedirectIfSignedIn>
      <AuthShell
        title="Create your account"
        wide
        footer={
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        }
      >
        <Suspense fallback={<p>Loading…</p>}>
          <SignupForm />
        </Suspense>
      </AuthShell>
    </RedirectIfSignedIn>
  );
}