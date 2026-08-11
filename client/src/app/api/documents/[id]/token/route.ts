import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { corsPreflight, getRequestUser, withCors } from "@/lib/mobile-auth"

export async function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getRequestUser(request)

    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true, publicAccess: true },
    })

    if (!document) {
      return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request)
    }

    const isOwner = !!(user?.id && document.userId === user.id)
    const isPublic = document.publicAccess !== "PRIVATE"
    if (!isOwner && !isPublic) {
      return withCors(NextResponse.json({ error: "Forbidden" }, { status: 403 }), request)
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return withCors(
        NextResponse.json({ error: "Server misconfigured" }, { status: 500 }),
        request
      )
    }

    const canEdit = isOwner || document.publicAccess === "WRITE"
    const token = jwt.sign(
      {
        documentId: id,
        permission: canEdit ? "WRITE" : "READ",
        userId: user?.id || "guest",
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "1h" }
    )

    return withCors(NextResponse.json({ token, canEdit, isOwner }), request)
  } catch (error) {
    console.error("Failed to mint collab token:", error)
    return withCors(NextResponse.json({ error: "Internal error" }, { status: 500 }), request)
  }
}
