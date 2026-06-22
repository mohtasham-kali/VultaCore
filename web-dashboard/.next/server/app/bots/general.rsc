1:"$Sreact.fragment"
3:I[59576,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"AuthProvider"]
4:I[38992,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"SettingsProvider"]
5:"$Sreact.suspense"
6:I[56273,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"NavigationEvents"]
7:I[87555,[],""]
8:I[31295,[],""]
9:I[6874,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","6926","static/chunks/6926-f6bfc2eada8829fb.js","6874","static/chunks/6874-46713ebbfd181d25.js","6682","static/chunks/6682-8efcc760a85f9c51.js","7219","static/chunks/7219-2d7948df5b6cd42f.js","8974","static/chunks/app/page-59aa3a7e9a4f641a.js"],""]
a:I[60636,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"Analytics"]
b:I[94970,[],"ClientSegmentRoot"]
c:I[26569,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","6926","static/chunks/6926-f6bfc2eada8829fb.js","6874","static/chunks/6874-46713ebbfd181d25.js","6682","static/chunks/6682-8efcc760a85f9c51.js","638","static/chunks/638-ba5690188ca5c383.js","7219","static/chunks/7219-2d7948df5b6cd42f.js","4944","static/chunks/app/(app)/layout-bda1e21027c55c3d.js"],"default"]
e:I[90894,[],"ClientPageRoot"]
f:I[74331,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","8490","static/chunks/838c1cc8-ea13cc5100ce248d.js","2584","static/chunks/2584-5259cec5a304cbbf.js","4513","static/chunks/app/(app)/bots/general/page-ccaeacca02b6541d.js"],"default"]
12:I[59665,[],"OutletBoundary"]
15:I[74911,[],"AsyncMetadataOutlet"]
17:I[59665,[],"ViewportBoundary"]
19:I[59665,[],"MetadataBoundary"]
1b:I[26614,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/78a180ba44995baf.css","style"]
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
            0:{"P":null,"b":"Tf2YujI5othCXMQswSDmw","p":"","c":["","bots","general",""],"i":false,"f":[[["",{"children":["(app)",{"children":["bots",{"children":["general",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/78a180ba44995baf.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"className":"__variable_246ccd __variable_c29908 antialiased","children":["$","$L3",null,{"children":["$","$L4",null,{"children":[["$","$5",null,{"fallback":null,"children":["$","$L6",null,{}]}],["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$La",null,{}]]}]}]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$c","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@d"}]]}],{"children":["bots",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["general",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$Le",null,{"Component":"$f","searchParams":{},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promises":["$@10","$@11"]}],null,["$","$L12",null,{"children":["$L13","$L14",["$","$L15",null,{"promise":"$@16"}]]}]]}],{},null,false]},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","Af0Zbnzh7hUeAW0n0z3wWv",{"children":[["$","$L17",null,{"children":"$L18"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L19",null,{"children":"$L1a"}]]}],false]],"m":"$undefined","G":["$1b","$undefined"],"s":false,"S":true}
1c:I[74911,[],"AsyncMetadata"]
d:{}
10:{}
11:{}
1a:["$","div",null,{"hidden":true,"children":["$","$5",null,{"fallback":null,"children":["$","$L1c",null,{"promise":"$@1d"}]}]}]
14:null
18:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
13:null
16:{"metadata":[["$","title","0",{"children":"VultaCore"}],["$","meta","1",{"name":"description","content":"Advanced Developer & Cybersecurity Dashboard"}],["$","link","2",{"rel":"shortcut icon","href":"/favicon.ico"}],["$","link","3",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"32x32"}],["$","link","4",{"rel":"icon","href":"/favicon.ico"}],["$","link","5",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]],"error":null,"digest":"$undefined"}
1d:{"metadata":"$16:metadata","error":null,"digest":"$undefined"}
