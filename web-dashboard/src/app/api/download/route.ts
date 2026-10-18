import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const os = (searchParams.get('os') || '').toLowerCase();
  const format = (searchParams.get('format') || '').toLowerCase();
  const fileParam = searchParams.get('file');

  const cwd = process.cwd();
  const candidateDirs = [
    path.join(cwd, 'public', 'downloads'),
    path.join(cwd, '..', 'public', 'downloads'),
    path.join(cwd, '..', 'downloaded-installers', 'installers-linux'),
    path.join(cwd, '..', 'downloaded-installers'),
    path.join(cwd, 'web-dashboard', 'public', 'downloads'),
  ];

  let targetFilePath: string | null = null;

  // Direct filename match if requested
  if (fileParam) {
    const safeName = path.basename(fileParam);
    for (const dir of candidateDirs) {
      const candidate = path.join(dir, safeName);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        targetFilePath = candidate;
        break;
      }
    }
  }

  // OS & Format based resolution
  if (!targetFilePath) {
    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;
      let files: string[] = [];
      try {
        files = fs.readdirSync(dir);
      } catch {
        continue;
      }

      if (os === 'windows' || os === 'win') {
        const match = files.find(f => f.endsWith('.exe')) || files.find(f => f.endsWith('.msi'));
        if (match) {
          targetFilePath = path.join(dir, match);
          break;
        }
      } else if (os === 'linux') {
        if (format === 'deb') {
          const match = files.find(f => f.endsWith('.deb')) || files.find(f => f.endsWith('.AppImage'));
          if (match) {
            targetFilePath = path.join(dir, match);
            break;
          }
        } else {
          const match = files.find(f => f.endsWith('.AppImage')) || files.find(f => f.endsWith('.deb'));
          if (match) {
            targetFilePath = path.join(dir, match);
            break;
          }
        }
      } else if (os === 'macos' || os === 'mac' || os === 'darwin') {
        const match = files.find(f => f.endsWith('.dmg')) || files.find(f => f.endsWith('.pkg'));
        if (match) {
          targetFilePath = path.join(dir, match);
          break;
        }
      }
    }
  }

  // Stream binary directly to client with attachment headers
  if (targetFilePath && fs.existsSync(targetFilePath)) {
    const filename = path.basename(targetFilePath);
    const stats = fs.statSync(targetFilePath);
    const nodeStream = fs.createReadStream(targetFilePath);

    // Convert Node Readable stream to Web ReadableStream
    const webStream = typeof (Readable as any).toWeb === 'function'
      ? (Readable as any).toWeb(nodeStream)
      : new ReadableStream({
          start(controller) {
            nodeStream.on('data', chunk => controller.enqueue(chunk));
            nodeStream.on('end', () => controller.close());
            nodeStream.on('error', err => controller.error(err));
          },
          cancel() {
            nodeStream.destroy();
          }
        });

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Fallback directly to release asset if not yet packaged on local filesystem
  let fallbackUrl = 'https://github.com/mohtasham-kali/VultaCore/releases/latest';
  if (os === 'windows' || os === 'win') {
    fallbackUrl = 'https://github.com/mohtasham-kali/VultaCore/releases/latest/download/VultaCore_0.1.0_x64-setup.exe';
  } else if (os === 'macos' || os === 'mac' || os === 'darwin') {
    fallbackUrl = 'https://github.com/mohtasham-kali/VultaCore/releases/latest/download/VultaCore_0.1.0_x64.dmg';
  } else if (os === 'linux') {
    fallbackUrl = format === 'deb'
      ? 'https://github.com/mohtasham-kali/VultaCore/releases/latest/download/VultaCore_0.1.0_amd64.deb'
      : 'https://github.com/mohtasham-kali/VultaCore/releases/latest/download/VultaCore_0.1.0_amd64.AppImage';
  }

  return NextResponse.redirect(fallbackUrl, { status: 302 });
}
