import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFile, updateFile, deleteFile, moveToTrash, downloadFile } from "@/lib/drive";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId } = await params;
    const download = request.nextUrl.searchParams.get("download") === "true";

    if (download) {
      const content = await downloadFile(session.accessToken, fileId);
      const file = await getFile(session.accessToken, fileId);

      return new NextResponse(new Uint8Array(content), {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": `attachment; filename="${file.name}"`,
        },
      });
    }

    const file = await getFile(session.accessToken, fileId);
    return NextResponse.json(file);
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId } = await params;
    const body = await request.json();

    const file = await updateFile(session.accessToken, fileId, body);
    return NextResponse.json(file);
  } catch (error) {
    console.error("Update file error:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    if (permanent) {
      await deleteFile(session.accessToken, fileId);
    } else {
      await moveToTrash(session.accessToken, fileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
