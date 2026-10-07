import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";

export const metadata = {
  title: "Log in — Vemee",
};

export default function LoginPage() {
  return (
    <RedirectIfSignedIn>
      <AuthShell
        title="Welcome back"
        subtitle="Log in with your phone to continue discovering people and plans."
        footer={
          <>
            New to Vemee? <Link href="/signup">Get started</Link>
          </>
        }
      >
        <Suspense fallback={<p>Loading…</p>}>
          <LoginForm />
        </Suspense>
      </AuthShell>
    </RedirectIfSignedIn>
  );
}