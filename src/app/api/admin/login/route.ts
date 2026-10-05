import { NextResponse } from "next/server";
import { signInAdmin } from "@/lib/admin/auth";

type Body = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const email = (body.email || "").trim();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 400 },
    );
  }

  const result = await signInAdmin(email, password);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
  });
}