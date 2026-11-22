1:"$Sreact.fragment"
5:I[5712,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"AuthProvider"]
6:I[63304,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"SettingsProvider"]
7:"$Sreact.suspense"
8:I[5289,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"NavigationEvents"]
9:I[56740,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"MaintenanceGuard"]
a:I[49287,[],""]
b:I[34235,[],""]
c:I[59534,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","9534","static/chunks/9534-907875466de78218.js","9995","static/chunks/9995-6a49468e4446927b.js","886","static/chunks/886-22b26da13f414f96.js","1142","static/chunks/1142-fafda4da32820e79.js","8974","static/chunks/app/page-8b9406182bdfccf8.js"],""]
d:I[38732,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"Analytics"]
e:I[86262,[],"ClientSegmentRoot"]
f:I[72569,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","9534","static/chunks/9534-907875466de78218.js","9995","static/chunks/9995-6a49468e4446927b.js","3736","static/chunks/3736-3b18585162dfaa20.js","886","static/chunks/886-22b26da13f414f96.js","1605","static/chunks/1605-3fff139a44d494db.js","1142","static/chunks/1142-fafda4da32820e79.js","4944","static/chunks/app/(app)/layout-57e4bc2c2865cbbd.js"],"default"]
11:I[4754,[],"ClientPageRoot"]
12:I[30193,["9404","static/chunks/app/(app)/forum/post/page-d686ba97da0ef6f5.js"],"default"]
15:I[93621,[],"OutletBoundary"]
18:I[16867,[],"AsyncMetadataOutlet"]
1a:I[93621,[],"ViewportBoundary"]
1c:I[93621,[],"MetadataBoundary"]
1e:I[27890,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/15730e9f7c5c55ef.css","style"]
:HL["/_next/static/css/f958ad24e39bbffd.css","style"]
:HL["/_next/static/css/9038931003336d76.css","style"]
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
            0:{"P":null,"b":"WDpykBnNTqVb64YtEWONo","p":"","c":["","forum","post"],"i":false,"f":[[["",{"children":["(app)",{"children":["forum",{"children":["post",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/15730e9f7c5c55ef.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/f958ad24e39bbffd.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","2",{"rel":"stylesheet","href":"/_next/static/css/9038931003336d76.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$2"}}],["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$3"}}]]}],["$","body",null,{"className":"__variable_8eaea4 __variable_8c25df antialiased","children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$4"}}],["$","$L5",null,{"children":["$","$L6",null,{"children":[["$","$7",null,{"fallback":null,"children":["$","$L8",null,{}]}],["$","$7",null,{"fallback":null,"children":["$","$L9",null,{}]}],["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$Lc",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$Ld",null,{}]]}]}]]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Le",null,{"Component":"$f","slots":{"children":["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@10"}]]}],{"children":["forum",["$","$1","c",{"children":[null,["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["post",["$","$1","c",{"children":[null,["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$L11",null,{"Component":"$12","searchParams":{},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promises":["$@13","$@14"]}],null,["$","$L15",null,{"children":["$L16","$L17",["$","$L18",null,{"promise":"$@19"}]]}]]}],{},null,false]},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","hEJTjBLpxFI8wxH6hVFKXv",{"children":[["$","$L1a",null,{"children":"$L1b"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L1c",null,{"children":"$L1d"}]]}],false]],"m":"$undefined","G":["$1e","$undefined"],"s":false,"S":true}
1f:I[16867,[],"AsyncMetadata"]
10:{}
13:{}
14:{}
1d:["$","div",null,{"hidden":true,"children":["$","$7",null,{"fallback":null,"children":["$","$L1f",null,{"promise":"$@20"}]}]}]
17:null
1b:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
16:null
19:{"metadata":[["$","title","0",{"children":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","1",{"name":"description","content":"A unified ecosystem for developers and security researchers. AI-powered assistance, real-time analytics, community forums, and security tooling — all in one dashboard."}],["$","meta","2",{"name":"robots","content":"index, follow"}],["$","link","3",{"rel":"canonical","href":"https://vultacore.techprogression.com"}],["$","meta","4",{"property":"og:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","5",{"property":"og:description","content":"AI mini-bots, dev and cybersecurity forums, real-time analytics, and enterprise security tooling."}],["$","meta","6",{"property":"og:url","content":"https://vultacore.techprogression.com"}],["$","meta","7",{"property":"og:site_name","content":"VultaCore"}],["$","meta","8",{"property":"og:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","meta","9",{"property":"og:image:width","content":"1200"}],["$","meta","10",{"property":"og:image:height","content":"630"}],["$","meta","11",{"property":"og:image:alt","content":"VultaCore"}],["$","meta","12",{"property":"og:type","content":"website"}],["$","meta","13",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","14",{"name":"twitter:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","15",{"name":"twitter:description","content":"AI-powered developer and security platform with forums, analytics, and AI bots."}],["$","meta","16",{"name":"twitter:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","link","17",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","18",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","19",{"rel":"icon","href":"/favicon.ico"}],["$","link","20",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
20:{"metadata":"$19:metadata","error":null,"digest":"$undefined"}
