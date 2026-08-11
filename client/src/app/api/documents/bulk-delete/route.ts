import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { corsPreflight, getRequestUser, withCors } from '@/lib/mobile-auth'

export async function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request)

    if (!user?.id) {
      return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request)
    }

    const { documentIds } = await request.json()

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return withCors(NextResponse.json({ error: 'Invalid document IDs' }, { status: 400 }), request)
    }

    const documentsToDelete = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        userId: user.id,
      },
      select: { id: true }
    })

    if (documentsToDelete.length === 0) {
      return withCors(NextResponse.json({ error: 'No documents found to delete' }, { status: 404 }), request)
    }

    const result = await prisma.document.deleteMany({
      where: {
        id: { in: documentsToDelete.map(d => d.id) },
        userId: user.id,
      }
    })

    return withCors(NextResponse.json({
      success: true,
      deletedCount: result.count
    }), request)
  } catch (error) {
    console.error('Failed to bulk delete documents:', error)
    return withCors(NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 }), request)
  }
}
