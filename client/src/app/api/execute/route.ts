import { NextResponse } from 'next/server';
import { corsPreflight, getRequestUser, withCors } from '@/lib/mobile-auth';

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const LANGUAGE_MAP: Record<string, { language: string; version: string; file: string }> = {
    javascript: { language: 'javascript', version: '18.15.0', file: 'index.js' },
    typescript: { language: 'typescript', version: '5.0.3', file: 'index.ts' },
    python: { language: 'python', version: '3.10.0', file: 'main.py' },
    java: { language: 'java', version: '15.0.2', file: 'Main.java' },
    c: { language: 'c', version: '10.2.0', file: 'main.c' },
    cpp: { language: 'c++', version: '10.2.0', file: 'main.cpp' },
    go: { language: 'go', version: '1.16.2', file: 'main.go' },
    rust: { language: 'rust', version: '1.68.2', file: 'main.rs' },
    php: { language: 'php', version: '8.2.3', file: 'index.php' },
    ruby: { language: 'ruby', version: '3.0.1', file: 'main.rb' },
    swift: { language: 'swift', version: '5.3.3', file: 'main.swift' },
};

const MAX_CODE_LENGTH = 100_000;
const MAX_STDIN_LENGTH = 10_000;

export async function OPTIONS(req: Request) {
    return corsPreflight(req);
}

export async function POST(req: Request) {
    try {
        const user = await getRequestUser(req);
        if (!user?.id) {
            return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), req);
        }

        const { language, code, stdin } = await req.json();

        if (!language || typeof code !== 'string') {
            return withCors(NextResponse.json({ error: 'Language and code are required' }, { status: 400 }), req);
        }

        if (code.length > MAX_CODE_LENGTH) {
            return withCors(NextResponse.json({ error: 'Code exceeds maximum length' }, { status: 400 }), req);
        }

        if (typeof stdin === 'string' && stdin.length > MAX_STDIN_LENGTH) {
            return withCors(NextResponse.json({ error: 'stdin exceeds maximum length' }, { status: 400 }), req);
        }

        const config = LANGUAGE_MAP[language];
        if (!config) {
            return withCors(NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 }), req);
        }

        const response = await fetch(PISTON_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: config.language,
                version: config.version,
                files: [{ name: config.file, content: code }],
                stdin: typeof stdin === 'string' ? stdin : '',
            }),
        });

        if (!response.ok) {
            throw new Error(`Piston API error: ${response.statusText}`);
        }

        const data = await response.json();
        return withCors(NextResponse.json(data), req);
    } catch (error) {
        console.error('Execution error:', error);
        return withCors(NextResponse.json({ error: 'Failed to execute code' }, { status: 500 }), req);
    }
}
