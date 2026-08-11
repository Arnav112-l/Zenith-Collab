import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsPreflight, getRequestUser, withCors } from '@/lib/mobile-auth'

export async function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function GET(req: Request) {
  try {
    const user = await getRequestUser(req)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    if (!user?.id) {
      return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), req)
    }

    const where: Record<string, unknown> = {
      userId: user.id,
    }

    if (!type) {
      where.isTrash = false
      where.isArchived = false
    } else if (type === 'trash') {
      where.isTrash = true
    } else if (type === 'archive') {
      where.isArchived = true
      where.isTrash = false
    } else if (type === 'favorites') {
      where.isFavorite = true
      where.isTrash = false
      where.isArchived = false
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
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

    return withCors(NextResponse.json(documents), req)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return withCors(NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 }), req)
  }
}
