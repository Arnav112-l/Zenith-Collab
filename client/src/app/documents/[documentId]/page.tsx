import EditorWrapper from '@/components/EditorWrapper'
import ShareButton from '@/components/ShareButton'
import DeleteButton from '@/components/DeleteButton'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UserMenu from '@/components/UserMenu'
import jwt from 'jsonwebtoken'
import { FileText, Clock, Code, Layout, PieChart, DollarSign, Trello, Calendar as CalendarIcon, Clock as ClockIcon, Target, Folder, Bot } from 'lucide-react'
import Link from 'next/link'
import DocumentSidebar from '@/components/DocumentSidebar'
import Starfield from '@/components/Starfield'
import SpecializedEditorWrapper from '@/components/SpecializedEditorWrapper'
import { EditorProvider } from '@/contexts/EditorContext'

// Map types to icons and colors
const getTypeConfig = (type: string) => {
  switch (type) {
    case 'CODE': return { icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    case 'CANVAS': return { icon: Layout, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    case 'BUDGET': return { icon: PieChart, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
    case 'EXPENSE': return { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    case 'KANBAN': return { icon: Trello, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    case 'CALENDAR': return { icon: CalendarIcon, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    case 'TIMETRACKER': return { icon: ClockIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    case 'GOALS': return { icon: Target, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' };
    case 'FILES': return { icon: Folder, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    case 'AI': return { icon: Bot, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
    default: return { icon: FileText, color: 'text-[#f472b6]', bg: 'bg-[#f472b6]/10', border: 'border-[#f472b6]/20' };
  }
};

export default async function DocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params
  const session = await getServerSession(authOptions)

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  })

  if (!doc) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <Starfield />
        <div className="text-center relative z-10">
          <h1 className="text-2xl font-bold mb-4">Document not found</h1>
          <Link href="/" className="text-[#f472b6] hover:text-[#ec4899] transition-colors">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = (session?.user?.id === doc.userId) || (!session && doc.userId === null);
  const isPublic = doc.publicAccess !== 'PRIVATE'
  const canEdit = isOwner || doc.publicAccess === 'WRITE'
  const canView = isOwner || isPublic

  // if (!canView) {
  //   redirect('/login')
  // }

  const token = jwt.sign(
    { 
      documentId, 
      permission: canEdit ? 'WRITE' : 'READ',
      userId: session?.user?.id || "guest" 
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: '1h' }
  )

  // @ts-ignore - type field might not be generated yet
  const docType = doc.type || 'TEXT';
  const typeConfig = getTypeConfig(docType);
  const TypeIcon = typeConfig.icon;

  return (
    <EditorProvider>
      <div className="flex h-screen bg-black text-white overflow-hidden relative">
        <Starfield />
        
        {/* Sidebar with Stats */}
        <div className="relative z-20 h-full border-r border-[#27272a] bg-black/50 backdrop-blur-md">
          <DocumentSidebar currentDocId={documentId} showStats={true} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Floating Header */}
          <header className="flex-shrink-0 px-6 pt-6 pb-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0a0a]/60 backdrop-blur-xl border border-[#27272a] shadow-lg">
              <div className="flex items-center gap-4 min-w-0">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_20px_rgba(244,114,182,0.3)] transition-all duration-300 ${typeConfig.bg} border border-white/5`}>
                    <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white truncate group-hover:text-[#f472b6] transition-colors">
                      {doc.title}
                    </span>
                    <span className="text-xs text-[#a1a1aa] flex items-center gap-1">
                      <Clock size={10} />
                      Last edited just now
                    </span>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && (
                  <>
                    <ShareButton 
                      documentId={documentId} 
                      initialAccess={doc.publicAccess} 
                      isOwner={isOwner} 
                    />
                    
                    <DeleteButton 
                      documentId={documentId}
                      isOwner={isOwner}
                    />
                  </>
                )}
                
                <div className="h-8 w-[1px] bg-[#27272a] mx-1" />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Content - Editor Only */}
          <main className="flex-1 overflow-hidden px-6 pb-6 pt-2">
            <div className="h-full w-full max-w-[1400px] mx-auto">
              {/* Editor Section - Full Height with Glow */}
              <div className="h-full rounded-3xl bg-[#0a0a0a]/40 border border-[#27272a] shadow-[0_0_50px_-12px_rgba(244,114,182,0.1)] backdrop-blur-md overflow-hidden relative group">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#f472b6]/5 to-transparent pointer-events-none" />
                
                <div className="relative h-full overflow-hidden">
                  {docType === 'TEXT' ? (
                    <EditorWrapper documentId={documentId} readOnly={!canEdit} token={token} />
                  ) : (
                    <SpecializedEditorWrapper 
                      docType={docType} 
                      content={doc.content.toString()} 
                      canEdit={canEdit} 
                    />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </EditorProvider>
  )
}
