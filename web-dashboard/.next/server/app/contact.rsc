1:"$Sreact.fragment"
5:I[5712,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"AuthProvider"]
6:I[63304,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"SettingsProvider"]
7:"$Sreact.suspense"
8:I[5289,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"NavigationEvents"]
9:I[56740,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"MaintenanceGuard"]
a:I[49287,[],""]
b:I[34235,[],""]
c:I[59534,["9534","static/chunks/9534-907875466de78218.js","977","static/chunks/app/contact/page-93c529bb1efa9ee9.js"],""]
d:I[38732,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"Analytics"]
e:I[76178,["9534","static/chunks/9534-907875466de78218.js","977","static/chunks/app/contact/page-93c529bb1efa9ee9.js"],"default"]
f:I[93621,[],"OutletBoundary"]
12:I[16867,[],"AsyncMetadataOutlet"]
14:I[93621,[],"ViewportBoundary"]
16:I[93621,[],"MetadataBoundary"]
18:I[27890,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/15730e9f7c5c55ef.css","style"]
:HL["/_next/static/css/624568a2268c1398.css","style"]
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
            0:{"P":null,"b":"nHK-atwpMZxn3_kfYnMSK","p":"","c":["","contact"],"i":false,"f":[[["",{"children":["contact",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/15730e9f7c5c55ef.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/624568a2268c1398.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","2",{"rel":"stylesheet","href":"/_next/static/css/9038931003336d76.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$2"}}],["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$3"}}]]}],["$","body",null,{"className":"__variable_8eaea4 __variable_8c25df antialiased","children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$4"}}],["$","$L5",null,{"children":["$","$L6",null,{"children":[["$","$7",null,{"fallback":null,"children":["$","$L8",null,{}]}],["$","$7",null,{"fallback":null,"children":["$","$L9",null,{}]}],["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$Lc",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$Ld",null,{}]]}]}]]}]]}]]}],{"children":["contact",["$","$1","c",{"children":[null,["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white","children":["$","div",null,{"className":"container mx-auto px-6 py-16 max-w-4xl","children":[["$","div",null,{"className":"mb-12","children":[["$","$Lc",null,{"href":"/","className":"text-sm text-purple-400 hover:text-purple-300 transition-colors","children":"← Back to VultaCore"}],["$","h1",null,{"className":"text-4xl font-extrabold mt-4 mb-2 tracking-tight","children":"Contact Us"}],["$","p",null,{"className":"text-slate-400 text-sm","children":"Have questions about VultaCore, subscriptions, or enterprise deployments? We're here to help."}]]}],["$","div",null,{"className":"grid grid-cols-1 md:grid-cols-2 gap-8 mb-12","children":[["$","div",null,{"className":"p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4","children":[["$","div",null,{"className":"w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center","children":["$","$Le",null,{"ref":"$undefined","iconNode":[["path",{"d":"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7","key":"132q7q"}],["rect",{"x":"2","y":"4","width":"20","height":"16","rx":"2","key":"izxlao"}]],"className":"lucide-mail w-6 h-6"}]}],["$","h3",null,{"className":"text-xl font-bold text-white","children":"General & Billing Support"}],["$","p",null,{"className":"text-slate-400 text-sm","children":"For account issues, subscription questions, receipt requests, and technical support."}],["$","div",null,{"children":["$","a",null,{"href":"mailto:support@techprogression.com","className":"text-purple-400 hover:text-purple-300 font-medium text-sm hover:underline","children":"support@techprogression.com"}]}]]}],["$","div",null,{"className":"p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4","children":[["$","div",null,{"className":"w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center","children":["$","$Le",null,{"ref":"$undefined","iconNode":[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z","key":"oel41y"}],["path",{"d":"m9 12 2 2 4-4","key":"dzmm74"}]],"className":"lucide-shield-check w-6 h-6"}]}],["$","h3",null,{"className":"text-xl font-bold text-white","children":"Enterprise & Security"}],["$","p",null,{"className":"text-slate-400 text-sm","children":"Custom integrations, dedicated SLA agreements, and security vulnerability disclosures."}],["$","div",null,{"children":["$","a",null,{"href":"mailto:mohtisham@techprogression.com","className":"text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline","children":"mohtisham@techprogression.com"}]}]]}]]}],["$","div",null,{"className":"p-8 rounded-2xl bg-white/5 border border-white/10 space-y-6","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"Company Information"}],["$","div",null,{"className":"grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300","children":[["$","div",null,{"className":"flex items-start gap-3","children":[["$","$Le",null,{"ref":"$undefined","iconNode":[["circle",{"cx":"12","cy":"12","r":"10","key":"1mglay"}],["path",{"d":"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20","key":"13o1zl"}],["path",{"d":"M2 12h20","key":"9i4pu4"}]],"className":"lucide-globe w-5 h-5 text-purple-400 mt-0.5 shrink-0"}],["$","div",null,{"children":[["$","strong",null,{"children":"Legal Entity:"}],["$","p",null,{"className":"text-slate-400","children":"TechProgression · VultaCore"}],["$","p",null,{"className":"text-slate-400","children":"Website: vultacore.techprogression.com"}]]}]]}],["$","div",null,{"className":"flex items-start gap-3","children":[["$","$Le",null,{"ref":"$undefined","iconNode":[["path",{"d":"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0","key":"1r0f0z"}],["circle",{"cx":"12","cy":"10","r":"3","key":"ilqhr7"}]],"className":"lucide-map-pin w-5 h-5 text-purple-400 mt-0.5 shrink-0"}],["$","div",null,{"children":[["$","strong",null,{"children":"Merchant of Record & Payments:"}],["$","p",null,{"className":"text-slate-400","children":"Paddle.com Inc. / Paddle Payments Ltd."}],["$","p",null,{"className":"text-slate-400","children":"Buyer Portal: paddle.net"}]]}]]}]]}]]}]]}]}],null,["$","$Lf",null,{"children":["$L10","$L11",["$","$L12",null,{"promise":"$@13"}]]}]]}],{},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","btH-O9nCFARVdwTHsP2OSv",{"children":[["$","$L14",null,{"children":"$L15"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L16",null,{"children":"$L17"}]]}],false]],"m":"$undefined","G":["$18","$undefined"],"s":false,"S":true}
19:I[16867,[],"AsyncMetadata"]
17:["$","div",null,{"hidden":true,"children":["$","$7",null,{"fallback":null,"children":["$","$L19",null,{"promise":"$@1a"}]}]}]
11:null
15:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
10:null
13:{"metadata":[["$","title","0",{"children":"Contact Us — VultaCore | VultaCore"}],["$","meta","1",{"name":"description","content":"Get in touch with the VultaCore and TechProgression team for support, enterprise sales, or security inquiries."}],["$","meta","2",{"name":"robots","content":"index, follow"}],["$","link","3",{"rel":"canonical","href":"https://vultacore.techprogression.com"}],["$","meta","4",{"property":"og:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","5",{"property":"og:description","content":"AI mini-bots, dev and cybersecurity forums, real-time analytics, and enterprise security tooling."}],["$","meta","6",{"property":"og:url","content":"https://vultacore.techprogression.com"}],["$","meta","7",{"property":"og:site_name","content":"VultaCore"}],["$","meta","8",{"property":"og:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","meta","9",{"property":"og:image:width","content":"1200"}],["$","meta","10",{"property":"og:image:height","content":"630"}],["$","meta","11",{"property":"og:image:alt","content":"VultaCore"}],["$","meta","12",{"property":"og:type","content":"website"}],["$","meta","13",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","14",{"name":"twitter:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","15",{"name":"twitter:description","content":"AI-powered developer and security platform with forums, analytics, and AI bots."}],["$","meta","16",{"name":"twitter:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","link","17",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","18",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","19",{"rel":"icon","href":"/favicon.ico"}],["$","link","20",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
1a:{"metadata":"$13:metadata","error":null,"digest":"$undefined"}
