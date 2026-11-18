import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://vultacore.techprogression.com';

const HOME_MARKDOWN = `# VultaCore

> A unified developer and cybersecurity platform combining AI-powered assistance, real-time analytics, community forums, and security tooling.

**URL:** ${BASE_URL}  
**Organization:** TechProgression  
**Contact:** support@techprogression.com

## What is VultaCore?

VultaCore is a SaaS platform for developers and security researchers that provides:

- **AI Mini-Bots** — Specialised AI assistants for general coding and cybersecurity
- **Developer Forum** — Q&A with reputation points and rewards
- **Security Forum** — Exclusive cybersecurity discussions and tool sharing  
- **Real-Time Analytics** — Usage insights and visual charts
- **Desktop App** — Native app for Windows, macOS, and Linux
- **Enterprise Features** — Custom plans, advanced settings, and dedicated support

## Key Pages

| Page | URL | Description |
|---|---|---|
| Home | ${BASE_URL}/ | Platform overview |
| Dev Forum | ${BASE_URL}/forum/dev | Developer Q&A |
| Security Forum | ${BASE_URL}/forum/cyber | Cybersecurity discussions |
| AI Bot (General) | ${BASE_URL}/bots/general | General AI assistant |
| AI Bot (Cyber) | ${BASE_URL}/bots/cyber | Security AI assistant |
| Analytics | ${BASE_URL}/analytics | Usage metrics |
| Pricing | ${BASE_URL}/pricing | Plans and pricing |
| Download | ${BASE_URL}/download | Desktop app downloads |
| Enterprise | ${BASE_URL}/enterprise-contact | Enterprise enquiries |

## Plans

- **Free** — Full access to forums, basic AI bot access
- **Pro** — Enhanced AI, advanced analytics, priority support  
- **Enterprise** — Custom integrations, SLA, dedicated account management

## Machine-Readable Resources

- Health: ${BASE_URL}/health (JSON)
- Sitemap: ${BASE_URL}/sitemap.xml
- LLMs: ${BASE_URL}/llms.txt
- MCP Card: ${BASE_URL}/.well-known/mcp/server-card.json

## Content Policy

search=yes, ai-train=no, ai-inference=yes
`;

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  const format = searchParams.get('format');

  const wantsMarkdown =
    format === 'md' ||
    accept.includes('text/markdown') ||
    accept.includes('text/plain');

  if (!wantsMarkdown) {
    return new NextResponse(null, { status: 406, statusText: 'Not Acceptable — use Accept: text/markdown or ?format=md' });
  }

  return new NextResponse(HOME_MARKDOWN, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Link': `<${BASE_URL}/llms.txt>; rel="alternate"; type="text/plain", <${BASE_URL}/.well-known/mcp/server-card.json>; rel="mcp-server-card"`,
    },
  });
}

