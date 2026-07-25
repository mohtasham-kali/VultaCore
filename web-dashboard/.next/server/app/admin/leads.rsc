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
e:I[28642,["4339","static/chunks/d28dc9c7-043043494f482b7b.js","4746","static/chunks/4746-c980e7d921f8a182.js","1901","static/chunks/1901-1ed1156304c451d4.js","953","static/chunks/953-1a11df4cc80898c9.js","9534","static/chunks/9534-907875466de78218.js","600","static/chunks/app/(app)/admin/layout-61a47b41a1be80b3.js"],"default"]
10:I[4754,[],"ClientPageRoot"]
11:I[96967,["6319","static/chunks/app/(app)/admin/leads/page-1e0aca4fe24787fa.js"],"default"]
14:I[93621,[],"OutletBoundary"]
17:I[16867,[],"AsyncMetadataOutlet"]
19:I[93621,[],"ViewportBoundary"]
1b:I[93621,[],"MetadataBoundary"]
1d:I[27890,[],""]
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
            0:{"P":null,"b":"jWkcqEAWmtB57TiymC6aF","p":"","c":["","admin","leads",""],"i":false,"f":[[["",{"children":["(app)",{"children":["admin",{"children":["leads",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/ff42bba8dd07c5c0.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"className":"antialiased","children":["$","$L3",null,{"children":["$","$L4",null,{"children":[["$","$5",null,{"fallback":null,"children":["$","$L6",null,{}]}],["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$La",null,{}]]}]}]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$c","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@d"}]]}],{"children":["admin",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$e","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promise":"$@f"}]]}],{"children":["leads",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$L10",null,{"Component":"$11","searchParams":{},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promises":["$@12","$@13"]}],null,["$","$L14",null,{"children":["$L15","$L16",["$","$L17",null,{"promise":"$@18"}]]}]]}],{},null,false]},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","b_0l5ohJUT_gbKK1UpyDGv",{"children":[["$","$L19",null,{"children":"$L1a"}],null]}],["$","$L1b",null,{"children":"$L1c"}]]}],false]],"m":"$undefined","G":["$1d","$undefined"],"s":false,"S":true}
1e:I[16867,[],"AsyncMetadata"]
d:{}
f:{}
12:{}
13:{}
1c:["$","div",null,{"hidden":true,"children":["$","$5",null,{"fallback":null,"children":["$","$L1e",null,{"promise":"$@1f"}]}]}]
16:null
1a:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
15:null
18:{"metadata":[["$","title","0",{"children":"VultaCore"}],["$","meta","1",{"name":"description","content":"Advanced Developer & Cybersecurity Dashboard"}],["$","link","2",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","3",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","4",{"rel":"icon","href":"/favicon.ico"}],["$","link","5",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
1f:{"metadata":"$18:metadata","error":null,"digest":"$undefined"}
