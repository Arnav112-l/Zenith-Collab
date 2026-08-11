import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { DocumentType } from "@prisma/client"
import * as Y from "yjs"
import { corsPreflight, getRequestUser, withCors } from "@/lib/mobile-auth"

export async function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function POST(req: Request) {
  const user = await getRequestUser(req)

  if (!user?.id) {
    return withCors(new NextResponse("Unauthorized", { status: 401 }), req)
  }

  try {
    let body: { title?: string; type?: string } = {}
    try {
      body = await req.json()
    } catch {
      // Empty body is valid — defaults apply below
    }
    const { title, type } = body

    let initialContent: Buffer

    if (type === "CANVAS") {
      const canvasData = { elements: [], appState: { viewBackgroundColor: "#121212" } }
      initialContent = Buffer.from(JSON.stringify(canvasData))
    } else if (type === "CODE") {
      const ydoc = new Y.Doc()
      const ytext = ydoc.getText("monaco")
      ytext.insert(0, "// Start coding...\nconsole.log('Hello World');")
      initialContent = Buffer.from(Y.encodeStateAsUpdate(ydoc))
    } else if (type === "TEXT") {
      initialContent = Buffer.from("")
    } else if (type === "FILES") {
      initialContent = Buffer.from("[]")
    } else if (type === "KANBAN") {
      initialContent = Buffer.from(
        JSON.stringify({
          columns: [
            { id: "todo", title: "To Do", taskIds: [] },
            { id: "in-progress", title: "In Progress", taskIds: [] },
            { id: "done", title: "Done", taskIds: [] },
          ],
          tasks: {},
        })
      )
    } else {
      initialContent = Buffer.from("{}")
    }

    const doc = await prisma.document.create({
      data: {
        title: title || "Untitled Document",
        type: (type as DocumentType) || DocumentType.TEXT,
        content: initialContent,
        userId: user.id,
      },
    })

    return withCors(NextResponse.json({ id: doc.id, type: doc.type, title: doc.title }), req)
  } catch (error) {
    console.error("Failed to create document:", error)
    return withCors(new NextResponse("Internal Server Error", { status: 500 }), req)
  }
}
