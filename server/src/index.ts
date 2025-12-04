import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { startEventScheduler } from './scheduler'

const prisma = new PrismaClient()
const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

// Start event notification scheduler
startEventScheduler()

// Document creation is now handled by Next.js API (client/src/app/api/documents/route.ts)

const hocuspocus = new Server({
    extensions: [
        new Database({
            fetch: async ({ documentName }) => {
                console.log(`DEBUG: Fetching document ${documentName}`)
                const doc = await prisma.document.findUnique({
                    where: { id: documentName },
                })
                if (doc?.content) {
                    console.log(`DEBUG: Found document with content size: ${doc.content.length} bytes`)
                    return doc.content
                }
                console.log(`DEBUG: No content found for document ${documentName}`)
                return null
            },
            store: async ({ documentName, state }) => {
                console.log(`DEBUG: Storing document ${documentName}, size: ${state.length} bytes`)
                await prisma.document.upsert({
                    where: { id: documentName },
                    create: {
                        id: documentName,
                        content: Buffer.from(state),
                        title: 'Untitled',
                    },
                    update: {
                        content: Buffer.from(state),
                    },
                })
                console.log(`DEBUG: Document ${documentName} saved successfully`)
            },
        }),
    ],
    onAuthenticate: async (data) => {
        const { documentName, requestParameters, connection } = data as any
        let { token } = data as any

        console.log('DEBUG: onAuthenticate called for document:', documentName)

        if (!token && requestParameters) {
            // Check both direct property and .get() method (URLSearchParams)
            token = requestParameters.token || (requestParameters.get && requestParameters.get('token'))
        }

        if (!token) {
            console.error('DEBUG: No token provided')
            throw new Error('Unauthorized: No token provided')
        }

        try {
            const secret = process.env.NEXTAUTH_SECRET || 'supersecret-random-string-for-dev-environment-only'
            const payload = jwt.verify(token as string, secret) as any

            console.log('DEBUG: Auth successful - Permission:', payload.permission)

            if (payload.documentId !== documentName) {
                throw new Error('Unauthorized: Invalid document ID')
            }

            // Set read-only mode if permission is READ
            if (payload.permission === 'READ' && connection) {
                connection.readOnly = true
                console.log(`DEBUG: Connection set to READ-ONLY mode`)
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
    onChange: async (data) => {
        console.log(`DEBUG: Document changed: ${data.documentName}, context: ${data.context}`)
    },
    onConnect: (data) => {
        console.log('DEBUG: Client connected')
        return Promise.resolve()
    },
    onDisconnect: (data) => {
        console.log('DEBUG: Client disconnected')
        return Promise.resolve()
    },
})

const server = app.listen(4000, '0.0.0.0', () => {
    console.log('Server running on port 4000')
})

server.on('upgrade', (request, socket, head) => {
    const wsServer = (hocuspocus as any).webSocketServer
    wsServer.handleUpgrade(request, socket, head, (ws: any) => {
        wsServer.emit('connection', ws, request)
    })
})
