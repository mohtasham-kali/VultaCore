1:"$Sreact.fragment"
3:I[9576,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"AuthProvider"]
4:I[8992,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"SettingsProvider"]
5:"$Sreact.suspense"
6:I[6273,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"NavigationEvents"]
7:I[7555,[],""]
8:I[1295,[],""]
9:I[6874,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","926","static/chunks/926-108a2eb3c76e3b57.js","874","static/chunks/874-a1e111dd065795db.js","766","static/chunks/766-f889181fb233caba.js","436","static/chunks/436-faec530223ca6913.js","974","static/chunks/app/page-9567b57171b9332d.js"],""]
a:I[636,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"Analytics"]
b:I[9665,[],"OutletBoundary"]
e:I[4911,[],"AsyncMetadataOutlet"]
10:I[9665,[],"ViewportBoundary"]
12:I[9665,[],"MetadataBoundary"]
14:I[6614,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/f5271587012faf78-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/9fc23737a6753ede.css","style"]
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
            0:{"P":null,"b":"oGPsTFp_uLPi_p4K3mCNj","p":"","c":["","_not-found"],"i":false,"f":[[["",{"children":["/_not-found",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/9fc23737a6753ede.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"className":"__variable_246ccd __variable_4c40f6 antialiased","children":["$","$L3",null,{"children":["$","$L4",null,{"children":[["$","$5",null,{"fallback":null,"children":["$","$L6",null,{}]}],["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$La",null,{}]]}]}]}]]}]]}],{"children":["/_not-found",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],null,["$","$Lb",null,{"children":["$Lc","$Ld",["$","$Le",null,{"promise":"$@f"}]]}]]}],{},null,false]},null,false]},null,false],["$","$1","h",{"children":[["$","meta",null,{"name":"robots","content":"noindex"}],["$","$1","KwWnu2dZQ8dFA7vp1BsXJv",{"children":[["$","$L10",null,{"children":"$L11"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L12",null,{"children":"$L13"}]]}],false]],"m":"$undefined","G":["$14","$undefined"],"s":false,"S":true}
15:I[4911,[],"AsyncMetadata"]
13:["$","div",null,{"hidden":true,"children":["$","$5",null,{"fallback":null,"children":["$","$L15",null,{"promise":"$@16"}]}]}]
d:null
11:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
c:null
f:{"metadata":[["$","title","0",{"children":"VultaCore"}],["$","meta","1",{"name":"description","content":"Advanced Developer & Cybersecurity Dashboard"}],["$","link","2",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","3",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","4",{"rel":"icon","href":"/favicon.ico"}],["$","link","5",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
16:{"metadata":"$f:metadata","error":null,"digest":"$undefined"}
