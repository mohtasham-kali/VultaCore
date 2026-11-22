1:"$Sreact.fragment"
5:I[5712,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"AuthProvider"]
6:I[63304,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"SettingsProvider"]
7:"$Sreact.suspense"
8:I[5289,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"NavigationEvents"]
9:I[56740,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"MaintenanceGuard"]
a:I[49287,[],""]
b:I[34235,[],""]
c:I[59534,["9534","static/chunks/9534-907875466de78218.js","9877","static/chunks/app/privacy/page-1f13be7b922f635b.js"],""]
d:I[38732,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4171","static/chunks/4171-60b67783958693ae.js","8683","static/chunks/8683-cc73a56fe4edb8c3.js","7177","static/chunks/app/layout-c4fe9dd2cf6dd8a0.js"],"Analytics"]
e:I[93621,[],"OutletBoundary"]
11:I[16867,[],"AsyncMetadataOutlet"]
13:I[93621,[],"ViewportBoundary"]
15:I[93621,[],"MetadataBoundary"]
17:I[27890,[],""]
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
            0:{"P":null,"b":"WDpykBnNTqVb64YtEWONo","p":"","c":["","privacy"],"i":false,"f":[[["",{"children":["privacy",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/15730e9f7c5c55ef.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","1",{"rel":"stylesheet","href":"/_next/static/css/f958ad24e39bbffd.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","link","2",{"rel":"stylesheet","href":"/_next/static/css/9038931003336d76.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$2"}}],["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$3"}}]]}],["$","body",null,{"className":"__variable_8eaea4 __variable_8c25df antialiased","children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$4"}}],["$","$L5",null,{"children":["$","$L6",null,{"children":[["$","$7",null,{"fallback":null,"children":["$","$L8",null,{}]}],["$","$7",null,{"fallback":null,"children":["$","$L9",null,{}]}],["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$Lc",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$Ld",null,{}]]}]}]]}]]}]]}],{"children":["privacy",["$","$1","c",{"children":[null,["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white","children":["$","div",null,{"className":"container mx-auto px-6 py-16 max-w-4xl","children":[["$","div",null,{"className":"mb-12","children":[["$","$Lc",null,{"href":"/","className":"text-sm text-purple-400 hover:text-purple-300 transition-colors","children":"← Back to VultaCore"}],["$","h1",null,{"className":"text-4xl font-extrabold mt-4 mb-2 tracking-tight","children":"Privacy Policy"}],["$","p",null,{"className":"text-slate-400 text-sm","children":"Last updated: November 18, 2026"}]]}],["$","div",null,{"className":"space-y-8 text-slate-300 leading-relaxed","children":[["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"1. Overview"}],["$","p",null,{"children":["TechProgression (\"we\", \"our\", or \"us\") operates VultaCore (",["$","a",null,{"href":"https://vultacore.techprogression.com","className":"text-purple-400 hover:underline","children":"vultacore.techprogression.com"}],"). We respect your privacy and are committed to protecting personal information collected through our developer platform and services."]}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"2. Information We Collect"}],["$","ul",null,{"className":"list-disc pl-6 space-y-2","children":[["$","li",null,{"children":[["$","strong",null,{"children":"Account Information:"}]," Name, email address, username, password hash, and authentication credentials."]}],["$","li",null,{"children":[["$","strong",null,{"children":"Usage and Telemetry:"}]," Log data, browser type, device information, API interaction counts, and IP address."]}],["$","li",null,{"children":[["$","strong",null,{"children":"Billing Data:"}]," Payment processing is handled by our Merchant of Record, Paddle.com. We do not store sensitive credit card numbers on our servers."]}]]}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"3. How We Use Information"}],["$","p",null,{"children":"We use collected data to:"}],["$","ul",null,{"className":"list-disc pl-6 space-y-2","children":[["$","li",null,{"children":"Provide, maintain, and optimize VultaCore tools and developer APIs."}],["$","li",null,{"children":"Authenticate user sessions and enforce subscription access tiers."}],["$","li",null,{"children":"Send critical system alerts, security advisories, and transactional billing notifications."}],["$","li",null,{"children":"Detect and prevent malicious activity, abuse, or security incidents."}]]}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"4. Third-Party Processors & Merchant of Record"}],["$","p",null,{"children":"We partner with trusted third-party providers including Paddle.com (Merchant of Record and payment gateway) and cloud infrastructure providers. Paddle processes your transaction data in compliance with PCI-DSS and applicable data privacy regulations."}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"5. Your Data Rights (GDPR & CCPA)"}],["$","p",null,{"children":["Depending on your location, you have the right to access, rectify, port, or request erasure of your personal data. You may also object to certain processing activities. To exercise these rights, email us at"," ",["$","a",null,{"href":"mailto:support@techprogression.com","className":"text-purple-400 hover:underline","children":"support@techprogression.com"}],"."]}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"6. Security Measures"}],["$","p",null,{"children":"We implement industry-standard encryption, strict access controls, and continuous vulnerability scanning to protect your data in transit and at rest."}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"7. Contact Information"}],["$","p",null,{"children":["For privacy-related inquiries or data requests:",["$","br",null,{}],["$","strong",null,{"children":"TechProgression / VultaCore"}],["$","br",null,{}],"Email:"," ",["$","a",null,{"href":"mailto:support@techprogression.com","className":"text-purple-400 hover:underline","children":"support@techprogression.com"}]]}]]}]]}]]}]}],null,["$","$Le",null,{"children":["$Lf","$L10",["$","$L11",null,{"promise":"$@12"}]]}]]}],{},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","LmxVJxImL1g6wm5V9egyMv",{"children":[["$","$L13",null,{"children":"$L14"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L15",null,{"children":"$L16"}]]}],false]],"m":"$undefined","G":["$17","$undefined"],"s":false,"S":true}
18:I[16867,[],"AsyncMetadata"]
16:["$","div",null,{"hidden":true,"children":["$","$7",null,{"fallback":null,"children":["$","$L18",null,{"promise":"$@19"}]}]}]
10:null
14:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
f:null
12:{"metadata":[["$","title","0",{"children":"Privacy Policy — VultaCore | VultaCore"}],["$","meta","1",{"name":"description","content":"Privacy policy describing how TechProgression collects, uses, and safeguards your personal data on VultaCore."}],["$","meta","2",{"name":"robots","content":"index, follow"}],["$","link","3",{"rel":"canonical","href":"https://vultacore.techprogression.com"}],["$","meta","4",{"property":"og:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","5",{"property":"og:description","content":"AI mini-bots, dev and cybersecurity forums, real-time analytics, and enterprise security tooling."}],["$","meta","6",{"property":"og:url","content":"https://vultacore.techprogression.com"}],["$","meta","7",{"property":"og:site_name","content":"VultaCore"}],["$","meta","8",{"property":"og:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","meta","9",{"property":"og:image:width","content":"1200"}],["$","meta","10",{"property":"og:image:height","content":"630"}],["$","meta","11",{"property":"og:image:alt","content":"VultaCore"}],["$","meta","12",{"property":"og:type","content":"website"}],["$","meta","13",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","14",{"name":"twitter:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","15",{"name":"twitter:description","content":"AI-powered developer and security platform with forums, analytics, and AI bots."}],["$","meta","16",{"name":"twitter:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","link","17",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","18",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","19",{"rel":"icon","href":"/favicon.ico"}],["$","link","20",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
19:{"metadata":"$12:metadata","error":null,"digest":"$undefined"}
