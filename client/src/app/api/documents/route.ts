import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as Y from "yjs";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, type } = body;

        let initialContent: Buffer;

        if (type === "CANVAS") {
            const canvasData = { elements: [], appState: { viewBackgroundColor: "#121212" } };
            initialContent = Buffer.from(JSON.stringify(canvasData));
        } else if (type === "CODE") {
            initialContent = Buffer.from("// Start coding...");
        } else if (type === "TEXT") {
            const ydoc = new Y.Doc();
            const state = Y.encodeStateAsUpdate(ydoc);
            initialContent = Buffer.from(state);
        } else if (type === "FILES") {
            initialContent = Buffer.from("[]");
        } else {
            // Default for other types (JSON empty object or similar)
            initialContent = Buffer.from("{}");
        }

        const doc = await prisma.document.create({
            data: {
                title: title || "Untitled Document",
                type: type || "TEXT",
                content: initialContent,
                userId: session?.user?.id || null,
            },
        });

        return NextResponse.json({ id: doc.id });
    } catch (error) {
        console.error("Failed to create document:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
