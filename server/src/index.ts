import 'dotenv/config'
import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import * as Y from 'yjs'
import { startEventScheduler } from './scheduler'

const prisma = new PrismaClient()
const port = Number(process.env.PORT) || 4000

startEventScheduler()

function isValidYjsUpdate(bytes: Uint8Array): boolean {
    try {
        const doc = new Y.Doc()
        Y.applyUpdate(doc, bytes)
        doc.destroy()
        return true
    } catch {
        return false
    }
}

function migratePlainTextToYjs(plainText: string): Uint8Array {
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('monaco')
    if (plainText) {
        ytext.insert(0, plainText)
    }
    const update = Y.encodeStateAsUpdate(ydoc)
    ydoc.destroy()
    return update
}

const hocuspocus = new Server({
    port,
    extensions: [
        new Database({
            fetch: async ({ documentName }) => {
                console.log(`Fetching document ${documentName}`)
                const doc = await prisma.document.findUnique({
                    where: { id: documentName },
                })
                if (!doc?.content) {
                    console.log(`No content found for document ${documentName}`)
                    return null
                }

                const bytes = new Uint8Array(doc.content)
                if (isValidYjsUpdate(bytes)) {
                    return Buffer.from(bytes)
                }

                // Legacy CODE docs were plain UTF-8 — migrate to Y.Text("monaco")
                if (doc.type === 'CODE') {
                    const plainText = Buffer.from(bytes).toString('utf8')
                    const migrated = migratePlainTextToYjs(plainText)
                    await prisma.document.update({
                        where: { id: documentName },
                        data: { content: Buffer.from(migrated) },
                    })
                    console.log(`Migrated legacy CODE content to Yjs for ${documentName}`)
                    return Buffer.from(migrated)
                }

                // Unreadable non-CODE binary: start from empty Yjs doc (do not persist wipe)
                console.warn(`Invalid Yjs content for ${documentName}; serving empty document`)
                return Buffer.from(Y.encodeStateAsUpdate(new Y.Doc()))
            },
            store: async ({ documentName, state }) => {
                console.log(`Storing document ${documentName}, size: ${state.length} bytes`)
                const existing = await prisma.document.findUnique({
                    where: { id: documentName },
                    select: { id: true },
                })
                if (!existing) {
                    console.warn(`Refusing to create orphan document ${documentName}`)
                    return
                }
                await prisma.document.update({
                    where: { id: documentName },
                    data: {
                        content: Buffer.from(state),
                    },
                })
                console.log(`Document ${documentName} saved successfully`)
            },
        }),
    ],
    async onAuthenticate(data: any) {
        const { documentName, requestParameters, connection } = data
        let { token } = data

        if (!token && requestParameters) {
            token = requestParameters.token || (requestParameters.get && requestParameters.get('token'))
        }

        if (!token) {
            throw new Error('Unauthorized: No token provided')
        }

        try {
            const secret = process.env.NEXTAUTH_SECRET
            if (!secret) {
                throw new Error('Unauthorized: Server misconfigured')
            }

            const payload = jwt.verify(token as string, secret) as any

            if (payload.documentId !== documentName) {
                throw new Error('Unauthorized: Invalid document ID')
            }

            if (payload.permission !== 'READ' && payload.permission !== 'WRITE') {
                throw new Error('Unauthorized: Invalid permission')
            }

            if (payload.permission === 'READ' && connection) {
                connection.readOnly = true
            }

            return {
                user: {
                    id: payload.userId || 'anonymous',
                    permission: payload.permission
                }
            }
        } catch (error) {
            console.error('Auth failed:', error)
            throw new Error('Unauthorized: Invalid token')
        }
    },
})

hocuspocus.listen()
console.log(`Hocuspocus server running on port ${port}`)
