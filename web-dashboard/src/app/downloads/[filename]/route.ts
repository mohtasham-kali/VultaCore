import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const GH_RELEASES_BASE = "https://github.com/mohtasham-kali/VultaCore/releases/latest/download";

// Map legacy or alternative filenames to exact GitHub Release asset filenames
const FILENAME_MAP: Record<string, string> = {
  "vultacore-0.1.0.exe": "VultaCore_0.1.0_x64-setup.exe",
  "vultacore-0.1.0.dmg": "VultaCore_0.1.0_universal.dmg",
  "vultacore-0.1.0.pkg": "VultaCore_0.1.0_universal.pkg",
  "VultaCore-0.1.0-1.x86_64.exe": "VultaCore_0.1.0_x64-setup.exe",
  "VultaCore-0.1.0-1.x86_64.dmg": "VultaCore_0.1.0_universal.dmg",
  "VultaCore-0.1.0-1.x86_64.pkg": "VultaCore_0.1.0_universal.pkg",
  "VultaCore-0.1.0-1.x86_64.AppImage": "VultaCore_0.1.0_amd64.AppImage",
  "VultaCore-0.1.0-1.x86_64.deb": "VultaCore_0.1.0_amd64.deb",
  "vultacore-2.1.0.exe": "VultaCore_0.1.0_x64-setup.exe",
  "vultacore-2.1.0.dmg": "VultaCore_0.1.0_universal.dmg",
  "vultacore-2.1.0.pkg": "VultaCore_0.1.0_universal.pkg",
  "vultacore-2.1.0.AppImage": "VultaCore_0.1.0_amd64.AppImage",
  "vultacore_2.1.0_amd64.deb": "VultaCore_0.1.0_amd64.deb",
  "vultacore-2.1.0.x86_64.rpm": "VultaCore-0.1.0-1.x86_64.rpm",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // 1. If file exists on server disk with real content (> 1000 bytes), serve it directly
  const localFilePath = path.join(process.cwd(), "public", "downloads", filename);
  if (fs.existsSync(localFilePath)) {
    const stats = fs.statSync(localFilePath);
    if (stats.isFile() && stats.size > 1000) {
      const fileStream = fs.createReadStream(localFilePath);
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": stats.size.toString(),
        },
      });
    }
  }

  // 2. Redirect to GitHub Releases asset for production installer downloads
  const targetFilename = FILENAME_MAP[filename] || filename;
  const targetUrl = `${GH_RELEASES_BASE}/${targetFilename}`;

  return NextResponse.redirect(targetUrl, 302);
}
