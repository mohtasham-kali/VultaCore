1:"$Sreact.fragment"
3:I[59576,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"AuthProvider"]
4:I[38992,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"SettingsProvider"]
5:"$Sreact.suspense"
6:I[56273,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"NavigationEvents"]
7:I[87555,[],""]
8:I[31295,[],""]
9:I[6874,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","6926","static/chunks/6926-f6bfc2eada8829fb.js","6874","static/chunks/6874-46713ebbfd181d25.js","6682","static/chunks/6682-8efcc760a85f9c51.js","8091","static/chunks/8091-0f717f9d73600a62.js","8974","static/chunks/app/page-cf751bc440b77ee4.js"],""]
a:I[60636,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","7177","static/chunks/app/layout-83ad7a7a5043fc02.js"],"Analytics"]
b:I[94970,[],"ClientSegmentRoot"]
c:I[24632,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","6926","static/chunks/6926-f6bfc2eada8829fb.js","6874","static/chunks/6874-46713ebbfd181d25.js","6682","static/chunks/6682-8efcc760a85f9c51.js","8091","static/chunks/8091-0f717f9d73600a62.js","4944","static/chunks/app/(app)/layout-277e1ae6501d1b70.js"],"default"]
e:I[8938,["4339","static/chunks/d28dc9c7-418d8e79e67e4678.js","2584","static/chunks/2584-5259cec5a304cbbf.js","6926","static/chunks/6926-f6bfc2eada8829fb.js","6874","static/chunks/6874-46713ebbfd181d25.js","600","static/chunks/app/(app)/admin/layout-00563ccde8304864.js"],"default"]
10:I[90894,[],"ClientPageRoot"]
11:I[97017,["6319","static/chunks/app/(app)/admin/leads/page-0d9616d1d3f56b56.js"],"default"]
14:I[59665,[],"OutletBoundary"]
17:I[74911,[],"AsyncMetadataOutlet"]
19:I[59665,[],"ViewportBoundary"]
1b:I[59665,[],"MetadataBoundary"]
1d:I[26614,[],""]
:HL["/_next/static/media/22a5144ee8d83bca-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/media/7d4881bb7e1bf84d-s.p.woff2","font",{"crossOrigin":"","type":"font/woff2"}]
:HL["/_next/static/css/af5ddbcea163cc48.css","style"]
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
            0:{"P":null,"b":"zqPCsb-1nTylz755xoNZv","p":"","c":["","admin","leads",""],"i":false,"f":[[["",{"children":["(app)",{"children":["admin",{"children":["leads",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/af5ddbcea163cc48.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]}],["$","body",null,{"className":"__variable_246ccd __variable_c29908 antialiased","children":["$","$L3",null,{"children":["$","$L4",null,{"children":[["$","$5",null,{"fallback":null,"children":["$","$L6",null,{}]}],["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4","children":[["$","h1",null,{"className":"text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400","children":"404"}],["$","p",null,{"className":"text-slate-400 text-xl mb-8","children":"Page Not Found"}],["$","$L9",null,{"href":"/","className":"px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors","children":"Return Home"}]]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}],["$","$La",null,{}]]}]}]}]]}]]}],{"children":["(app)",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$c","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":{},"promise":"$@d"}]]}],{"children":["admin",["$","$1","c",{"children":[null,["$","$Lb",null,{"Component":"$e","slots":{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promise":"$@f"}]]}],{"children":["leads",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L8",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$L10",null,{"Component":"$11","searchParams":{},"params":"$0:f:0:1:2:children:1:props:children:1:props:params","promises":["$@12","$@13"]}],null,["$","$L14",null,{"children":["$L15","$L16",["$","$L17",null,{"promise":"$@18"}]]}]]}],{},null,false]},null,false]},null,false]},null,false]},null,false],["$","$1","h",{"children":[null,["$","$1","moty9R1dEnDwn0S3ffhB3v",{"children":[["$","$L19",null,{"children":"$L1a"}],["$","meta",null,{"name":"next-size-adjust","content":""}]]}],["$","$L1b",null,{"children":"$L1c"}]]}],false]],"m":"$undefined","G":["$1d","$undefined"],"s":false,"S":true}
1e:I[74911,[],"AsyncMetadata"]
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
