import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { corsPreflight, getRequestUser, withCors } from "@/lib/mobile-auth";

export async function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestUser(request);
  const { id } = await params;

  if (!user?.id) {
    return withCors(new NextResponse("Unauthorized", { status: 401 }), request);
  }

  const json = await request.json();
  const { publicAccess } = json;

  if (!["PRIVATE", "READ", "WRITE"].includes(publicAccess)) {
    return withCors(new NextResponse("Invalid access level", { status: 400 }), request);
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!doc) {
      return withCors(new NextResponse("Not found", { status: 404 }), request);
    }

    if (doc.userId !== user.id) {
      return withCors(new NextResponse("Forbidden", { status: 403 }), request);
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { publicAccess },
      select: {
        id: true,
        title: true,
        publicAccess: true,
        updatedAt: true,
        userId: true,
        type: true,
      },
    });

    return withCors(NextResponse.json(updated), request);
  } catch (error) {
    console.error("Failed to update document:", error);
    return withCors(new NextResponse("Internal Server Error", { status: 500 }), request);
  }
}
