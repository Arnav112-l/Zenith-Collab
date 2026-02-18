import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const json = await request.json();
    const { publicAccess } = json;

    if (!["PRIVATE", "READ", "WRITE"].includes(publicAccess)) {
        return new NextResponse("Invalid access level", { status: 400 });
    }

    try {
        const doc = await prisma.document.findUnique({
            where: { id },
        });

        if (!doc) {
            return new NextResponse("Not found", { status: 404 });
        }

        // Allow if user owns doc, or doc has no owner (public docs)
        const isOwner = session?.user?.id && doc.userId === session.user.id;
        const noOwner = doc.userId === null;

        if (!isOwner && !noOwner) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updated = await prisma.document.update({
            where: { id },
            data: { publicAccess },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update document:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
