1:"$Sreact.fragment"
5:I[5712,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-eb104e0ff96008a4.js"],"AuthProvider"]
6:I[63304,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-eb104e0ff96008a4.js"],"SettingsProvider"]
7:"$Sreact.suspense"
8:I[5289,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-eb104e0ff96008a4.js"],"NavigationEvents"]
9:I[49287,[],""]
a:I[34235,[],""]
b:I[59534,["9534","static/chunks/9534-907875466de78218.js","469","static/chunks/app/refund/page-5682375fd16b98c2.js"],""]
c:I[38732,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","1901","static/chunks/1901-9879b78f50a6db0f.js","7177","static/chunks/app/layout-eb104e0ff96008a4.js"],"Analytics"]
d:I[93621,[],"OutletBoundary"]
10:I[16867,[],"AsyncMetadataOutlet"]
12:I[93621,[],"ViewportBoundary"]
14:I[93621,[],"MetadataBoundary"]
16:I[27890,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/18162bf911f011b3.css","style"]
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
            0:{"P":null,"b":"rKitWyHnEQGD3EIWxaenm","p":"","c":["","refund",""],"i":false,"f":[[["",{"children":["refund",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/18162bf911f011b3.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$2"}}],["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$3"}}]]}],["$","body",null,{"className":"__variable_8eaea4 __variable_8c25df antialiased","children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$4"}}],["$","$L5",null,{"children":["$","$L6",null,{"children":[["$","$7",null,{"fallback":null,"children":["$","$L8",null,{}]}],["$","$L9",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$Lb",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$Lc",null,{}]]}]}]]}]]}]]}],{"children":["refund",["$","$1","c",{"children":[null,["$","$L9",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$La",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white","children":["$","div",null,{"className":"container mx-auto px-6 py-16 max-w-4xl","children":[["$","div",null,{"className":"mb-12","children":[["$","$Lb",null,{"href":"/","className":"text-sm text-purple-400 hover:text-purple-300 transition-colors","children":"← Back to VultaCore"}],["$","h1",null,{"className":"text-4xl font-extrabold mt-4 mb-2 tracking-tight","children":"Refund & Cancellation Policy"}],["$","p",null,{"className":"text-slate-400 text-sm","children":"Last updated: November 18, 2026"}]]}],["$","div",null,{"className":"space-y-8 text-slate-300 leading-relaxed","children":[["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"1. Cancellation Policy"}],["$","p",null,{"children":["You can cancel your VultaCore subscription at any time directly through your account dashboard under"," ",["$","$Lb",null,{"href":"/subscription","className":"text-purple-400 hover:underline","children":"Subscription Settings"}]," ","or via the customer portal link provided in your billing confirmation emails."]}],["$","p",null,{"children":"When you cancel a subscription:"}],["$","ul",null,{"className":"list-disc pl-6 space-y-2","children":[["$","li",null,{"children":[["$","strong",null,{"children":"Scheduled Cancellation:"}]," Your cancellation will take effect at the end of your current paid billing period. You will retain full access to your plan features until that date."]}],["$","li",null,{"children":[["$","strong",null,{"children":"No Further Charges:"}]," You will not be billed for any subsequent billing periods after cancellation is scheduled."]}]]}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"2. 14-Day Refund Guarantee"}],["$","p",null,{"children":["We want you to be completely satisfied with VultaCore. If you are unsatisfied with your paid subscription for any reason, you may request a full refund within ",["$","strong",null,{"children":"14 days"}]," of your initial purchase or renewal date."]}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"3. How to Request a Refund"}],["$","p",null,{"children":["Because our order processing is conducted by our online reseller and Merchant of Record, ",["$","strong",null,{"children":"Paddle.com"}],", refunds may be requested either through:"]}],["$","ul",null,{"className":"list-disc pl-6 space-y-2","children":[["$","li",null,{"children":[["$","strong",null,{"children":"VultaCore Support:"}]," Email"," ",["$","a",null,{"href":"mailto:support@techprogression.com","className":"text-purple-400 hover:underline","children":"support@techprogression.com"}]," ","with your account email and Paddle order / transaction ID."]}],["$","li",null,{"children":[["$","strong",null,{"children":"Paddle Buyer Support:"}]," Directly visit"," ",["$","a",null,{"href":"https://paddle.net","target":"_blank","rel":"noopener noreferrer","className":"text-purple-400 hover:underline","children":"paddle.net"}]," ","using the email address used at checkout."]}]]}],["$","p",null,{"children":"Approved refunds are processed back to the original payment method (Credit Card, PayPal, Google Pay, Apple Pay) within 5–10 business days depending on your financial institution."}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"4. Exceptions"}],["$","p",null,{"children":"Refund requests submitted beyond the 14-day window or accounts terminated for violation of our Terms of Service (e.g., unlawful security attacks or abuse of developer APIs) are not eligible for refunds."}]]}],["$","section",null,{"className":"space-y-3","children":[["$","h2",null,{"className":"text-xl font-bold text-white","children":"5. Contact Information"}],["$","p",null,{"children":["If you have any questions regarding cancellations or refunds:",["$","br",null,{}],["$","strong",null,{"children":"TechProgression / VultaCore"}],["$","br",null,{}],"Email:"," ",["$","a",null,{"href":"mailto:support@techprogression.com","className":"text-purple-400 hover:underline","children":"support@techprogression.com"}]]}]]}]]}]]}]}],null,["$","$Ld",null,{"children":["$Le","$Lf",["$","$L10",null,{"promise":"$@11"}]]}]]}],{},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","t5kxGmTFkUlwzgYF9DfDnv",{"children":[["$","$L12",null,{"children":"$L13"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L14",null,{"children":"$L15"}]]}],false]],"m":"$undefined","G":["$16","$undefined"],"s":false,"S":true}
17:I[16867,[],"AsyncMetadata"]
15:["$","div",null,{"hidden":true,"children":["$","$7",null,{"fallback":null,"children":["$","$L17",null,{"promise":"$@18"}]}]}]
f:null
13:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
e:null
11:{"metadata":[["$","title","0",{"children":"Refund & Cancellation Policy — VultaCore | VultaCore"}],["$","meta","1",{"name":"description","content":"VultaCore's refund and cancellation terms for developer platform subscriptions and digital services."}],["$","meta","2",{"name":"robots","content":"index, follow"}],["$","link","3",{"rel":"canonical","href":"https://vultacore.techprogression.com/"}],["$","meta","4",{"property":"og:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","5",{"property":"og:description","content":"AI mini-bots, dev and cybersecurity forums, real-time analytics, and enterprise security tooling."}],["$","meta","6",{"property":"og:url","content":"https://vultacore.techprogression.com/"}],["$","meta","7",{"property":"og:site_name","content":"VultaCore"}],["$","meta","8",{"property":"og:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","meta","9",{"property":"og:image:width","content":"1200"}],["$","meta","10",{"property":"og:image:height","content":"630"}],["$","meta","11",{"property":"og:image:alt","content":"VultaCore"}],["$","meta","12",{"property":"og:type","content":"website"}],["$","meta","13",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","14",{"name":"twitter:title","content":"VultaCore — Developer & Cybersecurity Platform"}],["$","meta","15",{"name":"twitter:description","content":"AI-powered developer and security platform with forums, analytics, and AI bots."}],["$","meta","16",{"name":"twitter:image","content":"https://vultacore.techprogression.com/icon_master.png"}],["$","link","17",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","18",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","19",{"rel":"icon","href":"/favicon.ico"}],["$","link","20",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
18:{"metadata":"$11:metadata","error":null,"digest":"$undefined"}
