1:"$Sreact.fragment"
5:I[5712,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-7f358a94660b0c71.js"],"AuthProvider"]
6:I[63304,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-7f358a94660b0c71.js"],"SettingsProvider"]
7:"$Sreact.suspense"
8:I[5289,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-7f358a94660b0c71.js"],"NavigationEvents"]
9:I[49287,[],""]
a:I[34235,[],""]
b:I[59534,["9534","static/chunks/9534-907875466de78218.js","6612","static/chunks/app/(app)/welcome/page-1060175ca09ccd18.js"],""]
c:I[38732,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-7f358a94660b0c71.js"],"Analytics"]
d:I[86262,[],"ClientSegmentRoot"]
e:I[72569,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","9534","static/chunks/9534-907875466de78218.js","8985","static/chunks/8985-07cb32cbae4f1e3b.js","3736","static/chunks/3736-3b18585162dfaa20.js","886","static/chunks/886-22b26da13f414f96.js","1605","static/chunks/1605-3fff139a44d494db.js","1142","static/chunks/1142-fafda4da32820e79.js","4944","static/chunks/app/(app)/layout-bc5cf7457d662283.js"],"default"]
10:I[76178,["9534","static/chunks/9534-907875466de78218.js","6612","static/chunks/app/(app)/welcome/page-1060175ca09ccd18.js"],"default"]
11:I[93621,[],"OutletBoundary"]
14:I[16867,[],"AsyncMetadataOutlet"]
16:I[93621,[],"ViewportBoundary"]
18:I[93621,[],"MetadataBoundary"]
1a:I[27890,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/15730e9f7c5c55ef.css","style"]
:HL["/_next/static/css/b8ca3f55ac50f04e.css","style"]
2:T5b7,{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://vultacore.techprogression.com/#organization","name":"VultaCore","url":"https://vultacore.techprogression.com","logo":{"@type":"ImageObject","url":"https://vultacore.techprogression.com/icon_master.png"},"sameAs":["https://github.com/mohtasham-kali/VultaCore","https://techprogression.com"],"contactPoint":{"@type":"ContactPoint","contactType":"customer support","email":"support@techprogression.com","url":"https://vultacore.techprogression.com/enterprise-contact"}},{"@type":"WebSite","@id":"https://vultacore.techprogression.com/#website","url":"https://vultacore.techprogression.com","name":"VultaCore","description":"A unified developer and cybersecurity platform with AI bots, community forums, analytics, and enterprise security tooling.","publisher":{"@id":"https://vultacore.techprogression.com/#organization"},"potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://vultacore.techprogression.com/forum/dev?q={search_term_string}"},"query-input":"required name=search_term_string"}},{"@type":"SoftwareApplication","@id":"https://vultacore.techprogression.com/#app","name":"VultaCore","applicationCategory":"DeveloperApplication","operatingSystem":"Windows, macOS, Linux","url":"https://vultacore.techprogression.com/download","offers":{"@type":"Offer","price":"0","priceCurrency":"USD","availability":"https://schema.org/InStock"}}]}3:T58f,
              (function() {
                // Total suppression of MetaMask extension noise
                const suppress = (msg) => msg && typeof msg === 'string' && (msg.includes('MetaMask') || msg.includes('nkbihfbeogaeaoehlefnkodbefgpgknn'));
                
                const _error = console.error;
                console.error = function(...args) {
                  if (suppress(args[0]) || suppress(args[1])) return;
                  _error.apply(console, args);
                };

                const _warn = console.warn;
                console.warn = function(...args) {
                  if (suppress(args[0]) || suppress(args[1])) return;
                  _warn.apply(console, args);
                };

                window.addEventListener('unhandledrejection', (event) => {
                  const reason = event.reason;
                  if (reason && (suppress(reason.message) || suppress(reason.stack) || suppress(reason))) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);

                window.addEventListener('error', (event) => {
                  if (suppress(event.message) || suppress(event.filename)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);
              })();
            4:T5eb,
              if (typeof navigator !== 'undefined' && navigator.modelContext && navigator.modelContext.registerTool) {
                navigator.modelContext.registerTool({
                  name: 'vultacore_search_forum',
                  description: 'Search the VultaCore developer or cybersecurity forum for posts, questions, and discussions.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: { type: 'string', description: 'Search query' },
                      forum: { type: 'string', enum: ['dev', 'cyber'], description: 'Which forum to search' }
                    },
                    required: ['query']
                  },
                  execute: function(input) {
                    const f = input.forum || 'dev';
                    window.location.href = '/forum/' + f + '?q=' + encodeURIComponent(input.query);
                    return { status: 'navigating' };
                  }
                });
                navigator.modelContext.registerTool({
                  name: 'vultacore_health',
                  description: 'Check the live health and readiness of all VultaCore services (backend, dashboard, AI engine).',
                  inputSchema: { type: 'object', properties: {} },
                  execute: async function() {
                    const r = await fetch('/health');
                    return r.json();
                  }
                });
              }
            0:{"P":null,"b":"px0cB-DZMxGZ0wKw_F8wg","p":"","c":["","welcome"],"i":false,"f":[[["",{"children":["(app)",{"children":["welcome",{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/15730e9f7c5c55ef.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/b8ca3f55ac50f04e.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$2"}}],["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$3"}}]]}],["$","body",null,{"className":"__variable_8eaea4 __variable_8c25df antialiased","children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$4"}}],["$","$L5",null,{"children":["$","$L6",null,{"children":[["$","$7",null,{"fallback":null,"children":["$","$L8",null,{}]}],["$","$L9",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$Lb",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$Lc",null,{}]]}]}]]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Ld",null,{"Component":"$e","slots":{"children":["$","$L9",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@f"}]]}],{"children":["welcome",["$","$1","c",{"children":[null,["$","$L9",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white flex items-center justify-center p-6","children":[["$","div",null,{"className":"fixed inset-0 z-0 pointer-events-none","children":[["$","div",null,{"className":"absolute top-1/4 left-1/4 w-[35%] h-[35%] bg-purple-700/20 rounded-full blur-[120px]"}],["$","div",null,{"className":"absolute bottom-1/4 right-1/4 w-[35%] h-[35%] bg-blue-700/20 rounded-full blur-[120px]"}]]}],["$","div",null,{"className":"relative z-10 max-w-2xl w-full bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-500","children":[["$","div",null,{"className":"w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10","children":["$","$L10",null,{"ref":"$undefined","iconNode":[["circle",{"cx":"12","cy":"12","r":"10","key":"1mglay"}],["path",{"d":"m9 12 2 2 4-4","key":"dzmm74"}]],"className":"lucide-circle-check w-10 h-10"}]}],["$","div",null,{"className":"space-y-3","children":[["$","span",null,{"className":"text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20","children":"Payment Confirmed"}],["$","h1",null,{"className":"text-3xl md:text-4xl font-extrabold text-white tracking-tight","children":["Welcome to ",["$","span",null,{"className":"text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400","children":"VultaCore"}]]}],["$","p",null,{"className":"text-slate-400 text-sm md:text-base leading-relaxed","children":"Your subscription has been processed and activated. Your account tier, enhanced AI engines, and cybersecurity tools are now unlocked."}]]}],["$","div",null,{"className":"grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left","children":[["$","$Lb",null,{"href":"/bots/cyber","className":"p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group","children":[["$","$L10",null,{"ref":"$undefined","iconNode":[["path",{"d":"M12 8V4H8","key":"hb8ula"}],["rect",{"width":"16","height":"12","x":"4","y":"8","rx":"2","key":"enze0r"}],["path",{"d":"M2 14h2","key":"vft8re"}],["path",{"d":"M20 14h2","key":"4cs60a"}],["path",{"d":"M15 13v2","key":"1xurst"}],["path",{"d":"M9 13v2","key":"rq6x2g"}]],"className":"lucide-bot w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform"}],["$","h4",null,{"className":"text-sm font-bold text-white","children":"AI Cyber Bots"}],["$","p",null,{"className":"text-xs text-slate-400 mt-1","children":"Start reasoning with Claude 3 & Gemini Pro."}]]}],["$","$Lb",null,{"href":"/forum/dev","className":"p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group","children":[["$","$L10",null,{"ref":"$undefined","iconNode":[["path",{"d":"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z","key":"18887p"}]],"className":"lucide-message-square w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform"}],["$","h4",null,{"className":"text-sm font-bold text-white","children":"Dev Forums"}],["$","p",null,{"className":"text-xs text-slate-400 mt-1","children":"Collaborate with the developer community."}]]}],["$","$Lb",null,{"href":"/subscription","className":"p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group","children":[["$","$L10",null,{"ref":"$undefined","iconNode":[["rect",{"width":"20","height":"14","x":"2","y":"5","rx":"2","key":"ynyp8z"}],["line",{"x1":"2","x2":"22","y1":"10","y2":"10","key":"1b3vmo"}]],"className":"lucide-credit-card w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform"}],["$","h4",null,{"className":"text-sm font-bold text-white","children":"Subscription"}],["$","p",null,{"className":"text-xs text-slate-400 mt-1","children":"View billing details and invoices."}]]}]]}],["$","div",null,{"className":"pt-2","children":["$","$Lb",null,{"href":"/","className":"inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-purple-500/25 hover:brightness-110 transition-all text-sm","children":[["$","span",null,{"children":"Go to Dashboard"}],["$","$L10",null,{"ref":"$undefined","iconNode":[["path",{"d":"M5 12h14","key":"1ays0h"}],["path",{"d":"m12 5 7 7-7 7","key":"xquz4c"}]],"className":"lucide-arrow-right w-4 h-4"}]]}]}],["$","div",null,{"className":"flex items-center justify-center gap-2 text-xs text-slate-500 pt-4 border-t border-white/5","children":[["$","$L10",null,{"ref":"$undefined","iconNode":[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z","key":"oel41y"}],["path",{"d":"m9 12 2 2 4-4","key":"dzmm74"}]],"className":"lucide-shield-check w-4 h-4 text-purple-400"}],["$","span",null,{"children":"Billed securely via Paddle.com (Merchant of Record)"}]]}]]}]]}],null,["$","$L11",null,{"children":["$L12","$L13",["$","$L14",null,{"promise":"$@15"}]]}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","h90CWK1zQS4YYYgz2aZFOv",{"children":[["$","$L16",null,{"children":"$L17"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L18",null,{"children":"$L19"}]]}],false]],"m":"$undefined","G":["$1a","$undefined"],"s":false,"S":true}
1b:I[16867,[],"AsyncMetadata"]
f:{}
19:["$","div",null,{"hidden":true,"children":["$","$7",null,{"fallback":null,"children":["$","$L1b",null,{"promise":"$@1c"}]}]}]
13:null
17:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
12:null
15:{"metadata":[["$","title","0",{"children":"Welcome to VultaCore — Subscription Confirmed | VultaCore"}],["$","meta","1",{"name":"description","content":"Thank you for subscribing to VultaCore. Your new features and capabilities are now ready."}],["$","meta","2",{"name":"robots","content":"index, follow"}],["$","link","3",{"rel":"canonical","href":"https://vultacore.techprogression.com"}],["$","meta","4",{"property":"og:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","5",{"property":"og:description","content":"AI mini-bots, dev and cybersecurity forums, real-time analytics, and enterprise security tooling."}],["$","meta","6",{"property":"og:url","content":"https://vultacore.techprogression.com"}],["$","meta","7",{"property":"og:site_name","content":"VultaCore"}],["$","meta","8",{"property":"og:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","meta","9",{"property":"og:image:width","content":"1200"}],["$","meta","10",{"property":"og:image:height","content":"630"}],["$","meta","11",{"property":"og:image:alt","content":"VultaCore"}],["$","meta","12",{"property":"og:type","content":"website"}],["$","meta","13",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","14",{"name":"twitter:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","15",{"name":"twitter:description","content":"AI-powered developer and security platform with forums, analytics, and AI bots."}],["$","meta","16",{"name":"twitter:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","link","17",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","18",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","19",{"rel":"icon","href":"/favicon.ico"}],["$","link","20",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
1c:{"metadata":"$15:metadata","error":null,"digest":"$undefined"}
