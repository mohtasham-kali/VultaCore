1:"$Sreact.fragment"
3:I[5712,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","7177","static/chunks/app/layout-96d2068d9e69c2da.js"],"AuthProvider"]
4:I[63304,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","7177","static/chunks/app/layout-96d2068d9e69c2da.js"],"SettingsProvider"]
5:"$Sreact.suspense"
6:I[5289,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","7177","static/chunks/app/layout-96d2068d9e69c2da.js"],"NavigationEvents"]
7:I[49287,[],""]
8:I[34235,[],""]
9:I[59534,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","953","static/chunks/953-1a11df4cc80898c9.js","9534","static/chunks/9534-907875466de78218.js","886","static/chunks/886-a295b820a368c774.js","1142","static/chunks/1142-e9455cee1a090fa9.js","8974","static/chunks/app/page-afa706f27f4450a9.js"],""]
a:I[38732,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","7177","static/chunks/app/layout-96d2068d9e69c2da.js"],"Analytics"]
b:I[86262,[],"ClientSegmentRoot"]
c:I[72569,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","953","static/chunks/953-1a11df4cc80898c9.js","9534","static/chunks/9534-907875466de78218.js","886","static/chunks/886-a295b820a368c774.js","2442","static/chunks/2442-24489d4369394d3f.js","1142","static/chunks/1142-e9455cee1a090fa9.js","4944","static/chunks/app/(app)/layout-dd5989196b432cee.js"],"default"]
f:I[93621,[],"OutletBoundary"]
12:I[16867,[],"AsyncMetadataOutlet"]
14:I[93621,[],"ViewportBoundary"]
16:I[93621,[],"MetadataBoundary"]
18:I[27890,[],""]
:HL["/_next/static/css/ff42bba8dd07c5c0.css","style"]
2:T58f,
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
            0:{"P":null,"b":"3cm63SxFjB4kDJAh8AiIq","p":"","c":["","pricing",""],"i":false,"f":[[["",{"children":["(app)",{"children":["pricing",{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/ff42bba8dd07c5c0.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"className":"antialiased","children":["$","$L3",null,{"children":["$","$L4",null,{"children":[["$","$5",null,{"fallback":null,"children":["$","$L6",null,{}]}],["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$La",null,{}]]}]}]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$c","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@d"}]]}],{"children":["pricing",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":["$Le",null,["$","$Lf",null,{"children":["$L10","$L11",["$","$L12",null,{"promise":"$@13"}]]}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","5EG1AHE8393ocmzCoYECgv",{"children":[["$","$L14",null,{"children":"$L15"}],null]}],["$","$L16",null,{"children":"$L17"}]]}],false]],"m":"$undefined","G":["$18","$undefined"],"s":false,"S":true}
e:E{"digest":"NEXT_REDIRECT;replace;/subscription;307;"}
19:I[16867,[],"AsyncMetadata"]
d:{}
17:["$","div",null,{"hidden":true,"children":["$","$5",null,{"fallback":null,"children":["$","$L19",null,{"promise":"$@1a"}]}]}]
11:null
15:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
10:null
13:{"metadata":[["$","title","0",{"children":"VultaCore"}],["$","meta","1",{"name":"description","content":"Advanced Developer & Cybersecurity Dashboard"}],["$","link","2",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","3",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","4",{"rel":"icon","href":"/favicon.ico"}],["$","link","5",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
1a:{"metadata":"$13:metadata","error":null,"digest":"$undefined"}
