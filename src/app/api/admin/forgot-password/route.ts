import { NextResponse } from "next/server";
import { requestAdminPasswordReset } from "@/lib/admin/auth";

type Body = { email?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const result = await requestAdminPasswordReset(body.email || "");
  // Always 200 with generic message to avoid enumeration
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email, password reset instructions have been sent.",
  });
}