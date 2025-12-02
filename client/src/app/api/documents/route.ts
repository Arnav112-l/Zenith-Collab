import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const doc = await prisma.document.create({
            data: {
                title: "Untitled Document",
                content: Buffer.from(new Uint8Array(0)), // Empty Yjs doc
                userId: session.user.id,
            },
        });

        return NextResponse.json({ id: doc.id });
    } catch (error) {
        console.error("Failed to create document:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
