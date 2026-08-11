import { NextRequest, NextResponse } from "next/server"
import {
  corsPreflight,
  getRequestUser,
  withCors,
} from "@/lib/mobile-auth"

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req)
  }
  return withCors(NextResponse.json({ user }), req)
}
