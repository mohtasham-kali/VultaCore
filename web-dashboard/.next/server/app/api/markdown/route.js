(()=>{var e={};e.id=8045,e.ids=[8045],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16746:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>g,routeModule:()=>d,serverHooks:()=>y,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{GET:()=>u});var a=r(30781),n=r(60554),o=r(31625),i=r(96396);let c="https://vultacore.techprogression.com",p=`# VultaCore

> A unified developer and cybersecurity platform combining AI-powered assistance, real-time analytics, community forums, and security tooling.

**URL:** ${c}  
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
| Home | ${c}/ | Platform overview |
| Dev Forum | ${c}/forum/dev | Developer Q&A |
| Security Forum | ${c}/forum/cyber | Cybersecurity discussions |
| AI Bot (General) | ${c}/bots/general | General AI assistant |
| AI Bot (Cyber) | ${c}/bots/cyber | Security AI assistant |
| Analytics | ${c}/analytics | Usage metrics |
| Pricing | ${c}/pricing | Plans and pricing |
| Download | ${c}/download | Desktop app downloads |
| Enterprise | ${c}/enterprise-contact | Enterprise enquiries |

## Plans

- **Free** — Full access to forums, basic AI bot access
- **Pro** — Enhanced AI, advanced analytics, priority support  
- **Enterprise** — Custom integrations, SLA, dedicated account management

## Machine-Readable Resources

- Health: ${c}/health (JSON)
- Sitemap: ${c}/sitemap.xml
- LLMs: ${c}/llms.txt
- MCP Card: ${c}/.well-known/mcp/server-card.json

## Content Policy

search=yes, ai-train=no, ai-inference=yes
`;async function u(e){let{searchParams:t,pathname:r}=new URL(e.url),s=e.headers.get("accept")||"";return"md"===t.get("format")||s.includes("text/markdown")||s.includes("text/plain")?new i.NextResponse(p,{status:200,headers:{"Content-Type":"text/markdown; charset=utf-8","Cache-Control":"public, max-age=3600, stale-while-revalidate=86400",Link:`<${c}/llms.txt>; rel="alternate"; type="text/plain", <${c}/.well-known/mcp/server-card.json>; rel="mcp-server-card"`}}):new i.NextResponse(null,{status:406,statusText:"Not Acceptable — use Accept: text/markdown or ?format=md"})}let d=new a.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/markdown/route",pathname:"/api/markdown",filename:"route",bundlePath:"app/api/markdown/route"},resolvedPagePath:"/home/hacker/Documents/Projects/SaaS 2.0/tri-stack/web-dashboard/src/app/api/markdown/route.ts",nextConfigOutput:"standalone",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:m,serverHooks:y}=d;function g(){return(0,o.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:m})}},24429:()=>{},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},64749:()=>{}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9683,9146],()=>r(16746));module.exports=s})();