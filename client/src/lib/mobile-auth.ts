import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import jwt from "jsonwebtoken"
import { authOptions } from "@/lib/auth"

export type AuthUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

function getBearerToken(req: Request | NextRequest): string | null {
  const header = req.headers.get("authorization") || req.headers.get("Authorization")
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}

export function signMobileToken(user: AuthUser): string {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not configured")
  }
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      typ: "zenith-mobile",
    },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "30d" }
  )
}

export function verifyMobileToken(token: string): AuthUser | null {
  if (!process.env.NEXTAUTH_SECRET) return null
  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET) as jwt.JwtPayload
    if (!payload?.sub || payload.typ !== "zenith-mobile") return null
    return {
      id: String(payload.sub),
      name: (payload.name as string) || null,
      email: (payload.email as string) || null,
      image: (payload.image as string) || null,
    }
  } catch {
    return null
  }
}

/** Session cookie (web) or Bearer JWT (mobile). */
export async function getRequestUser(req: Request | NextRequest): Promise<AuthUser | null> {
  const token = getBearerToken(req)
  if (token) {
    return verifyMobileToken(token)
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
}

export function withCors(response: Response, req?: Request): Response {
  const origin = req?.headers.get("origin") || "*"
  response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With"
  )
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
  return response
}

export function corsPreflight(req: Request): Response {
  return withCors(new Response(null, { status: 204 }), req)
}
