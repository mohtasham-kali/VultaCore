1:"$Sreact.fragment"
3:I[9576,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"AuthProvider"]
4:I[8992,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"SettingsProvider"]
5:"$Sreact.suspense"
6:I[6273,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"NavigationEvents"]
7:I[7555,[],""]
8:I[1295,[],""]
9:I[6874,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","926","static/chunks/926-108a2eb3c76e3b57.js","874","static/chunks/874-a1e111dd065795db.js","682","static/chunks/682-1264d16d880aaa88.js","91","static/chunks/91-1798833e622a80ef.js","974","static/chunks/app/page-d74886cbf14c5307.js"],""]
a:I[636,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","177","static/chunks/app/layout-743a6ec846ead5cc.js"],"Analytics"]
b:I[4970,[],"ClientSegmentRoot"]
c:I[4632,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","926","static/chunks/926-108a2eb3c76e3b57.js","874","static/chunks/874-a1e111dd065795db.js","682","static/chunks/682-1264d16d880aaa88.js","91","static/chunks/91-1798833e622a80ef.js","944","static/chunks/app/(app)/layout-a3b0506cf5b1dbac.js"],"default"]
e:I[894,[],"ClientPageRoot"]
f:I[5927,["339","static/chunks/d28dc9c7-5b447f826fc033f0.js","584","static/chunks/584-bd913ad627d26365.js","926","static/chunks/926-108a2eb3c76e3b57.js","296","static/chunks/app/(app)/analytics/page-d257eab5dbba9551.js"],"default"]
12:I[9665,[],"OutletBoundary"]
15:I[4911,[],"AsyncMetadataOutlet"]
17:I[9665,[],"ViewportBoundary"]
19:I[9665,[],"MetadataBoundary"]
1b:I[6614,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/f5271587012faf78-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/b25495c92ec9a4e4.css","style"]
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
            0:{"P":null,"b":"_QcsKvINRX2nCdSfBoxo9","p":"","c":["","analytics"],"i":false,"f":[[["",{"children":["(app)",{"children":["analytics",{"children":["__PAGE__",{}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/b25495c92ec9a4e4.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"className":"__variable_246ccd __variable_4c40f6 antialiased","children":["$","$L3",null,{"children":["$","$L4",null,{"children":[["$","$5",null,{"fallback":null,"children":["$","$L6",null,{}]}],["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$La",null,{}]]}]}]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$c","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@d"}]]}],{"children":["analytics",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$Le",null,{"Component":"$f","searchParams":{},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promises":["$@10","$@11"]}],null,["$","$L12",null,{"children":["$L13","$L14",["$","$L15",null,{"promise":"$@16"}]]}]]}],{},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","Z0JJDB74iq1XK_uoxWVDtv",{"children":[["$","$L17",null,{"children":"$L18"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L19",null,{"children":"$L1a"}]]}],false]],"m":"$undefined","G":["$1b","$undefined"],"s":false,"S":true}
1c:I[4911,[],"AsyncMetadata"]
d:{}
10:{}
11:{}
1a:["$","div",null,{"hidden":true,"children":["$","$5",null,{"fallback":null,"children":["$","$L1c",null,{"promise":"$@1d"}]}]}]
14:null
18:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
13:null
16:{"metadata":[["$","title","0",{"children":"VultaCore"}],["$","meta","1",{"name":"description","content":"Advanced Developer & Cybersecurity Dashboard"}],["$","link","2",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","3",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","4",{"rel":"icon","href":"/favicon.ico"}],["$","link","5",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
1d:{"metadata":"$16:metadata","error":null,"digest":"$undefined"}
