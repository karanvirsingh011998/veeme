import { NextResponse } from "next/server";
import { getPublicAuthConfig } from "@/lib/auth/config";

export async function GET() {
  return NextResponse.json(getPublicAuthConfig());
}