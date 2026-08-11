import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { corsPreflight, getRequestUser, withCors } from '@/lib/mobile-auth'

export async function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getRequestUser(request)

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        userId: true,
        publicAccess: true,
        isArchived: true,
        isTrash: true,
        isFavorite: true,
        type: true,
        content: true,
      },
    })

    if (!document) {
      return withCors(NextResponse.json({ error: 'Document not found' }, { status: 404 }), request)
    }

    const isOwner = !!(user?.id && document.userId === user.id)
    const isPublic = document.publicAccess !== 'PRIVATE'
    if (!isOwner && !isPublic) {
      return withCors(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), request)
    }

    const canEdit = isOwner || document.publicAccess === 'WRITE'
    let content = ''
    try {
      content = Buffer.from(document.content).toString('utf8')
    } catch {
      content = ''
    }

    // TEXT/CODE may be Yjs binary — if not valid UTF-8 printable JSON/text, return empty/plain hint
    if (document.type === 'CODE' || document.type === 'TEXT') {
      const looksBinary = content.includes('\u0000') || /[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 50))
      if (looksBinary) {
        content = document.type === 'CODE' ? '// Start coding...\n' : ''
      }
    }

    return withCors(
      NextResponse.json({
        id: document.id,
        title: document.title,
        updatedAt: document.updatedAt,
        createdAt: document.createdAt,
        userId: document.userId,
        publicAccess: document.publicAccess,
        isArchived: document.isArchived,
        isTrash: document.isTrash,
        isFavorite: document.isFavorite,
        type: document.type,
        content,
        canEdit,
        isOwner,
      }),
      request
    )
  } catch (error) {
    console.error('Failed to fetch document:', error)
    return withCors(NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 }), request)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getRequestUser(request)

    if (!user?.id) {
      return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
    }

    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!document) {
      return withCors(NextResponse.json({ error: 'Document not found' }, { status: 404 }), request)
    }

    if (document.userId !== user.id) {
      return withCors(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), request)
    }

    await prisma.document.delete({
      where: { id },
    })

    return withCors(NextResponse.json({ success: true }), request)
  } catch (error) {
    console.error('Failed to delete document:', error)
    return withCors(NextResponse.json({ error: 'Failed to delete document' }, { status: 500 }), request)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getRequestUser(request)

    const json = await request.json()
    const { title, isArchived, isTrash, isFavorite, content } = json

    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true, publicAccess: true },
    })

    if (!document) {
      return withCors(NextResponse.json({ error: 'Document not found' }, { status: 404 }), request)
    }

    const isOwner = !!(user?.id && document.userId === user.id)
    const hasWriteAccess = document.publicAccess === 'WRITE'

    const touchesMetadata =
      title !== undefined ||
      isArchived !== undefined ||
      isTrash !== undefined ||
      isFavorite !== undefined

    if (touchesMetadata && !isOwner) {
      return withCors(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), request)
    }

    if (content !== undefined && !isOwner && !hasWriteAccess) {
      return withCors(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), request)
    }

    if (!isOwner && !hasWriteAccess) {
      return withCors(NextResponse.json({ error: 'Forbidden' }, { status: 403 }), request)
    }

    if (content !== undefined) {
      if (typeof content !== 'string') {
        return withCors(NextResponse.json({ error: 'Invalid content' }, { status: 400 }), request)
      }
      if (content.length > 2_000_000) {
        return withCors(NextResponse.json({ error: 'Content too large' }, { status: 413 }), request)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (isOwner) {
      if (title !== undefined) updateData.title = title
      if (isArchived !== undefined) updateData.isArchived = isArchived
      if (isTrash !== undefined) updateData.isTrash = isTrash
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite
    }
    if (content !== undefined && (isOwner || hasWriteAccess)) {
      updateData.content = Buffer.from(content)
    }

    if (Object.keys(updateData).length === 0) {
      return withCors(NextResponse.json({ error: 'No changes provided' }, { status: 400 }), request)
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        userId: true,
        publicAccess: true,
        isArchived: true,
        isTrash: true,
        isFavorite: true,
        type: true,
      },
    })

    return withCors(NextResponse.json(updated), request)
  } catch (error) {
    console.error('Failed to update document:', error)
    return withCors(NextResponse.json({ error: 'Failed to update document' }, { status: 500 }), request)
  }
}
