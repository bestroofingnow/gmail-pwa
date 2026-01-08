import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listFiles, searchFiles, createFolder, uploadFile } from "@/lib/drive";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get("folderId") || undefined;
    const query = searchParams.get("q") || undefined;
    const pageToken = searchParams.get("pageToken") || undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;
    const mimeType = searchParams.get("mimeType") || undefined;

    let result;
    if (query) {
      result = await searchFiles(session.accessToken, query, {
        pageToken,
        pageSize,
      });
    } else {
      result = await listFiles(session.accessToken, {
        folderId,
        pageToken,
        pageSize,
        mimeType,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Drive files error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const parentId = formData.get("parentId") as string | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const driveFile = await uploadFile(
        session.accessToken,
        file.name,
        file.type,
        buffer,
        parentId || undefined
      );

      return NextResponse.json(driveFile);
    } else {
      // Handle folder creation
      const body = await request.json();
      const { name, parentId, type } = body;

      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      if (type === "folder") {
        const folder = await createFolder(session.accessToken, name, parentId);
        return NextResponse.json(folder);
      }

      return NextResponse.json(
        { error: "Invalid request type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Create file/folder error:", error);
    return NextResponse.json(
      { error: "Failed to create file/folder" },
      { status: 500 }
    );
  }
}
