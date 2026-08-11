import { NextResponse } from 'next/server'
import { corsPreflight, getRequestUser, withCors } from '@/lib/mobile-auth'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const MAX_MESSAGES = 40
const MAX_CONTENT_LENGTH = 8_000

export async function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req)
    if (!user?.id) {
      return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), req)
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return withCors(
        NextResponse.json(
          {
            error: 'AI is not configured. Add OPENAI_API_KEY to the client environment.',
            code: 'AI_NOT_CONFIGURED',
          },
          { status: 503 }
        ),
        req
      )
    }

    const body = await req.json()
    const messages = body?.messages as ChatMessage[] | undefined

    if (!Array.isArray(messages) || messages.length === 0) {
      return withCors(NextResponse.json({ error: 'messages are required' }, { status: 400 }), req)
    }

    if (messages.length > MAX_MESSAGES) {
      return withCors(NextResponse.json({ error: 'Too many messages' }, { status: 400 }), req)
    }

    for (const message of messages) {
      if (
        !message ||
        (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'system') ||
        typeof message.content !== 'string' ||
        message.content.length > MAX_CONTENT_LENGTH
      ) {
        return withCors(NextResponse.json({ error: 'Invalid message payload' }, { status: 400 }), req)
      }
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are Zenith AI, a helpful assistant inside a collaborative workspace. Be concise and practical.',
          },
          ...messages.filter((m) => m.role !== 'system'),
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI error:', response.status, errText)
      return withCors(NextResponse.json({ error: 'Upstream AI request failed' }, { status: 502 }), req)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return withCors(NextResponse.json({ error: 'Empty AI response' }, { status: 502 }), req)
    }

    return withCors(NextResponse.json({ content }), req)
  } catch (error) {
    console.error('AI chat error:', error)
    return withCors(NextResponse.json({ error: 'Failed to complete AI request' }, { status: 500 }), req)
  }
}
