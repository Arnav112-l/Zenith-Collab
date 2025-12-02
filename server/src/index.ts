import { Server } from '@hocuspocus/server'
import { Database } from '@hocuspocus/extension-database'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

// Document creation is now handled by Next.js API (client/src/app/api/documents/route.ts)

const hocuspocus = new Server({
    extensions: [
        new Database({
            fetch: async ({ documentName }) => {
                const doc = await prisma.document.findUnique({
                    where: { id: documentName },
                })
                return doc?.content || null
            },
            store: async ({ documentName, state }) => {
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
            },
        }),
    ],
    onAuthenticate: async (data) => {
        const { documentName, connection, requestParameters } = data as any
        let { token } = data as any

        console.log('DEBUG: onAuthenticate data keys:', Object.keys(data))

        if (!token && requestParameters) {
            // Check both direct property and .get() method (URLSearchParams)
            token = requestParameters.token || (requestParameters.get && requestParameters.get('token'))
            console.log('DEBUG: Found token in requestParameters:', token)
        }

        if (!token) {
            throw new Error('Unauthorized: No token provided')
        }

        try {
            const secret = process.env.NEXTAUTH_SECRET || 'supersecret-random-string-for-dev-environment-only'
            const payload = jwt.verify(token as string, secret) as any

            console.log('DEBUG: Auth Payload:', payload)

            if (payload.documentId !== documentName) {
                throw new Error('Unauthorized: Invalid document ID')
            }

            if (payload.permission === 'READ') {
                // connection object is missing from data, so we fetch it from the instance
                const connection = (data.instance as any).connections.get(data.socketId)
                if (connection) {
                    connection.readOnly = true
                    console.log(`DEBUG: Set connection to ReadOnly for socket ${data.socketId}`)
                } else {
                    console.warn('DEBUG: Connection object not found for socketId:', data.socketId)
                }
            }
            // console.log(`DEBUG: Connection accepted. ReadOnly: ${connection?.readOnly}`) // connection might be undefined here if we log it directly from data

        } catch (error) {
            console.error('Auth failed:', error)
            throw new Error('Unauthorized: Invalid token')
        }

        console.log(`DEBUG: Client authenticated for ${documentName}`)
    },
    onChange: async (data) => {
        console.log(`DEBUG: Document changed: ${data.documentName}`)
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
