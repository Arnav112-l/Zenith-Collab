import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentIds } = await request.json()

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Invalid document IDs' }, { status: 400 })
    }

    // First, check which documents the user owns or has no owner
    const documentsToDelete = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        OR: [
          { userId: session.user.id },
          { userId: null } // Allow deletion of ownerless documents
        ]
      },
      select: { id: true }
    })

    if (documentsToDelete.length === 0) {
      return NextResponse.json({ error: 'No documents found to delete' }, { status: 404 })
    }

    // Delete the documents
    const result = await prisma.document.deleteMany({
      where: {
        id: { in: documentsToDelete.map(d => d.id) }
      }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    })
  } catch (error) {
    console.error('Failed to bulk delete documents:', error)
    return NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 })
  }
}
