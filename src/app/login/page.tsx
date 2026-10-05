import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in — Vemee",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your phone to continue discovering people and plans."
      footer={
        <>
          New to Vemee? <Link href="/signup">Get started</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}