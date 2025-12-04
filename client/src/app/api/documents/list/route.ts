import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'trash', 'archive', 'favorites'

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where: any = {
      OR: [
        { userId: session?.user?.id || null },
        { publicAccess: { not: 'PRIVATE' } }
      ]
    }

    // Default filter: Not trash, not archived
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
        updatedAt: 'desc'
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
      }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
