import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    const { documentIds } = await request.json()

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Invalid document IDs' }, { status: 400 })
    }

    // Check which documents the user owns or can delete
    const whereClause: any = {
      id: { in: documentIds },
    }

    // If logged in, filter by ownership; otherwise allow only ownerless docs
    if (session?.user?.id) {
      whereClause.OR = [
        { userId: session.user.id },
        { userId: null },
        { publicAccess: 'WRITE' }
      ]
    } else {
      whereClause.OR = [
        { userId: null },
        { publicAccess: 'WRITE' }
      ]
    }

    const documentsToDelete = await prisma.document.findMany({
      where: whereClause,
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
