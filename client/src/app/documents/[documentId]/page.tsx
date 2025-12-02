import EditorWrapper from '@/components/EditorWrapper'
import ShareButton from '@/components/ShareButton'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserMenu from '@/components/UserMenu'
import jwt from 'jsonwebtoken'

export default async function DocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params
  const session = await getServerSession(authOptions)

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  })

  if (!doc) {
    return <div>Document not found</div>
  }

  const isOwner = session?.user?.id === doc.userId
  const isPublic = doc.publicAccess !== 'PRIVATE'
  const canEdit = isOwner || doc.publicAccess === 'WRITE'
  const canView = isOwner || isPublic

  if (!canView) {
    redirect('/login')
  }

  const token = jwt.sign(
    { 
      documentId, 
      permission: canEdit ? 'WRITE' : 'READ',
      userId: session?.user?.id 
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '1h' }
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          NoteP - Realtime Collaboration
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none gap-4">
          <ShareButton 
            documentId={documentId} 
            initialAccess={doc.publicAccess} 
            isOwner={isOwner} 
          />
          <UserMenu />
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <h1 className="text-4xl font-bold text-center mb-8">
          {doc.title}
          {!canEdit && <span className="ml-4 text-sm font-normal text-gray-500">(Read Only)</span>}
        </h1>
      </div>

      <div className="w-full max-w-4xl">
        <EditorWrapper documentId={documentId} readOnly={!canEdit} token={token} />
      </div>
    </main>
  )
}
