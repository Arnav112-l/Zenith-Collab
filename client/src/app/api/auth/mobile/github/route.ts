import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  corsPreflight,
  signMobileToken,
  withCors,
} from "@/lib/mobile-auth"

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, redirectUri } = body as { code?: string; redirectUri?: string }

    if (!code || !redirectUri) {
      return withCors(
        NextResponse.json({ error: "code and redirectUri are required" }, { status: 400 }),
        req
      )
    }

    const clientId = process.env.GITHUB_ID
    const clientSecret = process.env.GITHUB_SECRET
    if (!clientId || !clientSecret) {
      return withCors(
        NextResponse.json({ error: "GitHub OAuth is not configured" }, { status: 500 }),
        req
      )
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenJson = await tokenRes.json()
    if (!tokenJson.access_token) {
      return withCors(
        NextResponse.json(
          { error: "Failed to exchange GitHub code", details: tokenJson },
          { status: 401 }
        ),
        req
      )
    }

    const ghRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Zenith-Collab-Mobile",
      },
    })
    const ghUser = await ghRes.json()
    if (!ghRes.ok) {
      return withCors(
        NextResponse.json({ error: "Failed to fetch GitHub profile" }, { status: 401 }),
        req
      )
    }

    let email: string | null = ghUser.email || null
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Zenith-Collab-Mobile",
        },
      })
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string
          primary: boolean
          verified: boolean
        }>
        email =
          emails.find((e) => e.primary && e.verified)?.email ||
          emails.find((e) => e.verified)?.email ||
          emails[0]?.email ||
          null
      }
    }

    const providerAccountId = String(ghUser.id)
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
      include: { user: true },
    })

    let user = existingAccount?.user

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } }) || undefined
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: ghUser.name || ghUser.login || "GitHub User",
          email,
          image: ghUser.avatar_url || null,
          accounts: {
            create: {
              type: "oauth",
              provider: "github",
              providerAccountId,
              access_token: tokenJson.access_token,
              token_type: tokenJson.token_type || "bearer",
              scope: tokenJson.scope || null,
            },
          },
        },
      })
    } else if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "github",
          providerAccountId,
          access_token: tokenJson.access_token,
          token_type: tokenJson.token_type || "bearer",
          scope: tokenJson.scope || null,
        },
      })
    }

    const token = signMobileToken({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })

    return withCors(
      NextResponse.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      }),
      req
    )
  } catch (error) {
    console.error("Mobile GitHub auth failed:", error)
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      req
    )
  }
}
