import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Allow deletion if user owns the document OR if document has no owner (public)
    const isOwner = session?.user?.id && document.userId === session.user.id
    const noOwner = document.userId === null

    if (!isOwner && !noOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the document
    await prisma.document.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const json = await request.json()
    const { title, isArchived, isTrash, isFavorite, content } = json

    // Check document and permissions
    const document = await prisma.document.findUnique({
      where: { id },
      select: { userId: true, publicAccess: true }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Allow updates if:
    // 1. User owns the document
    // 2. Document has WRITE public access
    // 3. Document has no owner (legacy)
    const isOwner = session?.user?.id && document.userId === session.user.id
    const hasWriteAccess = document.publicAccess === 'WRITE'
    const noOwner = document.userId === null

    if (!isOwner && !hasWriteAccess && !noOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (isArchived !== undefined) updateData.isArchived = isArchived
    if (isTrash !== undefined) updateData.isTrash = isTrash
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite
    if (content !== undefined) updateData.content = Buffer.from(content)

    const updated = await prisma.document.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update document:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}
