(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,35315,e=>{"use strict";var t=e.i(30891),r=e.i(85390),a=e.i(77707);class s extends Error{constructor(e,t){e instanceof Error?super(void 0,{cause:{err:e,...e.cause,...t}}):"string"==typeof e?(t instanceof Error&&(t={err:t,...t.cause}),super(e,t)):super(void 0,e),this.name=this.constructor.name,this.type=this.constructor.type??"AuthError",this.kind=this.constructor.kind??"error",Error.captureStackTrace?.(this,this.constructor);const r=`https://errors.authjs.dev#${this.type.toLowerCase()}`;this.message+=`${this.message?". ":""}Read more at ${r}`}}class o extends s{}class i extends s{}async function n(e,t,r,a={}){let s=`${l(t)}/${e}`;try{let e={headers:{"Content-Type":"application/json",...a?.headers?.cookie?{cookie:a.headers.cookie}:{}}};a?.body&&(e.body=JSON.stringify(a.body),e.method="POST");let t=await fetch(s,e),r=await t.json();if(!t.ok)throw r;return r}catch(e){return r.error(new o(e.message,e)),null}}function l(e){return"u"<typeof window?`${e.baseUrlServer}${e.basePathServer}`:e.basePath}function c(){return Math.floor(Date.now()/1e3)}function d(e){let t=new URL("http://localhost:3000/api/auth");e&&!e.startsWith("http")&&(e=`https://${e}`);let r=new URL(e||t),a=("/"===r.pathname?t.pathname:r.pathname).replace(/\/$/,""),s=`${r.origin}${a}`;return{origin:r.origin,host:r.host,path:a,base:s,toString:()=>s}}let u={baseUrl:d(t.default.env.NEXTAUTH_URL??t.default.env.VERCEL_URL).origin,basePath:d(t.default.env.NEXTAUTH_URL).path,baseUrlServer:d(t.default.env.NEXTAUTH_URL_INTERNAL??t.default.env.NEXTAUTH_URL??t.default.env.VERCEL_URL).origin,basePathServer:d(t.default.env.NEXTAUTH_URL_INTERNAL??t.default.env.NEXTAUTH_URL).path,_lastSync:0,_session:void 0,_getSession:()=>{}},p=null;function f(){return"u"<typeof BroadcastChannel?{postMessage:()=>{},addEventListener:()=>{},removeEventListener:()=>{},name:"next-auth",onmessage:null,onmessageerror:null,close:()=>{},dispatchEvent:()=>!1}:new BroadcastChannel("next-auth")}function m(){return null===p&&(p=f()),p}let h={debug:console.debug,error:console.error,warn:console.warn},g=a.createContext?.(void 0);function v(e){if(!g)throw Error("React Context is unavailable in Server Components");let t=a.useContext(g),{required:r,onUnauthenticated:s}=e??{},o=r&&"unauthenticated"===t.status;return(a.useEffect(()=>{if(o){let e=`${u.basePath}/signin?${new URLSearchParams({error:"SessionRequired",callbackUrl:window.location.href})}`;s?s():window.location.href=e}},[o,s]),o)?{data:t.data,update:t.update,status:"loading"}:t}async function y(e){let t=await n("session",u,h,e);return(e?.broadcast??!0)&&f().postMessage({event:"session",data:{trigger:"getSession"}}),t}async function b(){let e=await n("csrf",u,h);return e?.csrfToken??""}async function w(){return n("providers",u,h)}async function x(e,t,r){let{callbackUrl:a,...s}=t??{},{redirect:o=!0,redirectTo:i=a??window.location.href,...n}=s,c=l(u),d=await w();if(!d){let e=`${c}/error`;window.location.href=e;return}if(!e||!d[e]){let e=`${c}/signin?${new URLSearchParams({callbackUrl:i})}`;window.location.href=e;return}let p=d[e].type;if("webauthn"===p)throw TypeError(`Provider id "${e}" refers to a WebAuthn provider.
Please use \`import { signIn } from "next-auth/webauthn"\` instead.`);let f=`${c}/${"credentials"===p?"callback":"signin"}/${e}`,m=await b(),h=await fetch(`${f}?${new URLSearchParams(r)}`,{method:"post",headers:{"Content-Type":"application/x-www-form-urlencoded","X-Auth-Return-Redirect":"1"},body:new URLSearchParams({...n,csrfToken:m,callbackUrl:i})}),g=await h.json();if(o){let e=g.url??i;window.location.href=e,e.includes("#")&&window.location.reload();return}let v=new URL(g.url).searchParams.get("error")??void 0,y=new URL(g.url).searchParams.get("code")??void 0;return h.ok&&await u._getSession({event:"storage"}),{error:v,code:y,status:h.status,ok:h.ok,url:v?null:g.url}}async function E(e){let{redirect:t=!0,redirectTo:r=e?.callbackUrl??window.location.href}=e??{},a=l(u),s=await b(),o=await fetch(`${a}/signout`,{method:"post",headers:{"Content-Type":"application/x-www-form-urlencoded","X-Auth-Return-Redirect":"1"},body:new URLSearchParams({csrfToken:s,callbackUrl:r})}),i=await o.json();if(m().postMessage({event:"session",data:{trigger:"signout"}}),t){let e=i.url??r;window.location.href=e,e.includes("#")&&window.location.reload();return}return await u._getSession({event:"storage"}),i}function S(e){if(!g)throw Error("React Context is unavailable in Server Components");let{children:t,basePath:s,refetchInterval:o,refetchWhenOffline:l}=e;s&&(u.basePath=s);let d=void 0!==e.session;u._lastSync=d?c():0;let[p,f]=a.useState(()=>(d&&(u._session=e.session),e.session)),[v,w]=a.useState(!d);a.useEffect(()=>(u._getSession=async({event:e}={})=>{try{let t="storage"===e;if(t||void 0===u._session){u._lastSync=c(),u._session=await y({broadcast:!t}),f(u._session);return}if(!e||null===u._session||c()<u._lastSync)return;u._lastSync=c(),u._session=await y(),f(u._session)}catch(e){h.error(new i(e.message,e))}finally{w(!1)}},u._getSession(),()=>{u._lastSync=0,u._session=void 0,u._getSession=()=>{}}),[]),a.useEffect(()=>{let e=()=>u._getSession({event:"storage"});return m().addEventListener("message",e),()=>m().removeEventListener("message",e)},[]),a.useEffect(()=>{let{refetchOnWindowFocus:t=!0}=e,r=()=>{t&&"visible"===document.visibilityState&&u._getSession({event:"visibilitychange"})};return document.addEventListener("visibilitychange",r,!1),()=>document.removeEventListener("visibilitychange",r,!1)},[e.refetchOnWindowFocus]);let x=function(){let[e,t]=a.useState("u">typeof navigator&&navigator.onLine),r=()=>t(!0),s=()=>t(!1);return a.useEffect(()=>(window.addEventListener("online",r),window.addEventListener("offline",s),()=>{window.removeEventListener("online",r),window.removeEventListener("offline",s)}),[]),e}(),E=!1!==l||x;a.useEffect(()=>{if(o&&E){let e=setInterval(()=>{u._session&&u._getSession({event:"poll"})},1e3*o);return()=>clearInterval(e)}},[o,E]);let S=a.useMemo(()=>({data:p,status:v?"loading":p?"authenticated":"unauthenticated",async update(e){if(v)return;w(!0);let t=await n("session",u,h,void 0===e?void 0:{body:{csrfToken:await b(),data:e}});return w(!1),t&&(f(t),m().postMessage({event:"session",data:{trigger:"getSession"}})),t}}),[p,v]);return(0,r.jsx)(g.Provider,{value:S,children:t})}e.s(["SessionContext",0,g,"SessionProvider",()=>S,"__NEXTAUTH",0,u,"getCsrfToken",()=>b,"getProviders",()=>w,"getSession",()=>y,"signIn",()=>x,"signOut",()=>E,"useSession",()=>v],35315)},98992,e=>{"use strict";let t,r;var a,s=e.i(77707);let o={data:""},i=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,c=(e,t)=>{let r="",a="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?r=o+" "+i+";":a+="f"==o[1]?c(i,o):o+"{"+c(i,"k"==o[1]?"":t)+"}":"object"==typeof i?a+=c(i,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=c.p?c.p(o,i):o+":"+i+";")}return r+(t&&s?t+"{"+s+"}":s)+a},d={},u=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+u(e[r]);return t}return e};function p(e){let t,r,a=this||{},s=e.call?e(a.p):e;return((e,t,r,a,s)=>{var o;let p=u(e),f=d[p]||(d[p]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(p));if(!d[f]){let t=p!==e?e:(e=>{let t,r,a=[{}];for(;t=i.exec(e.replace(n,""));)t[4]?a.shift():t[3]?(r=t[3].replace(l," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(l," ").trim();return a[0]})(e);d[f]=c(s?{["@keyframes "+f]:t}:t,r?"":"."+f)}let m=r&&d.g?d.g:null;return r&&(d.g=d[f]),o=d[f],m?t.data=t.data.replace(m,o):-1===t.data.indexOf(o)&&(t.data=a?o+t.data:t.data+o),f})(s.unshift?s.raw?(t=[].slice.call(arguments,1),r=a.p,s.reduce((e,a,s)=>{let o=t[s];if(o&&o.call){let e=o(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":c(e,""):!1===e?"":e}return e+a+(null==o?"":o)},"")):s.reduce((e,t)=>Object.assign(e,t&&t.call?t(a.p):t),{}):s,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||o})(a.target),a.g,a.o,a.k)}p.bind({g:1});let f,m,h,g=p.bind({k:1});function v(e,t){let r=this||{};return function(){let a=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;r.p=Object.assign({theme:m&&m()},n),r.o=/ *go\d+/.test(l),n.className=p.apply(r,a)+(l?" "+l:""),t&&(n.ref=i);let c=e;return e[0]&&(c=n.as||e,delete n.as),h&&c[0]&&h(n),f(c,n)}return t?t(s):s}}var y=(e,t)=>"function"==typeof e?e(t):e,b=(t=0,()=>(++t).toString()),w=()=>{if(void 0===r&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");r=!e||e.matches}return r},x="default",E=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return E(e,{type:+!!e.toasts.find(e=>e.id===a.id),toast:a});case 3:let{toastId:s}=t;return{...e,toasts:e.toasts.map(e=>e.id===s||void 0===s?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},S=[],_={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},k={},$=(e,t=x)=>{k[t]=E(k[t]||_,e),S.forEach(([e,r])=>{e===t&&r(k[t])})},L=e=>Object.keys(k).forEach(t=>$(e,t)),T=(e=x)=>t=>{$(t,e)},U={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},C=(e={},t=x)=>{let[r,a]=(0,s.useState)(k[t]||_),o=(0,s.useRef)(k[t]);(0,s.useEffect)(()=>(o.current!==k[t]&&a(k[t]),S.push([t,a]),()=>{let e=S.findIndex(([e])=>e===t);e>-1&&S.splice(e,1)}),[t]);let i=r.toasts.map(t=>{var r,a,s;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(a=e[t.type])?void 0:a.duration)||(null==e?void 0:e.duration)||U[t.type],style:{...e.style,...null==(s=e[t.type])?void 0:s.style,...t.style}}});return{...r,toasts:i}},R=e=>(t,r)=>{let a,s=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||b()}))(t,e,r);return T(s.toasterId||(a=s.id,Object.keys(k).find(e=>k[e].toasts.some(e=>e.id===a))))({type:2,toast:s}),s.id},P=(e,t)=>R("blank")(e,t);P.error=R("error"),P.success=R("success"),P.loading=R("loading"),P.custom=R("custom"),P.dismiss=(e,t)=>{let r={type:3,toastId:e};t?T(t)(r):L(r)},P.dismissAll=e=>P.dismiss(void 0,e),P.remove=(e,t)=>{let r={type:4,toastId:e};t?T(t)(r):L(r)},P.removeAll=e=>P.remove(void 0,e),P.promise=(e,t,r)=>{let a=P.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?y(t.success,e):void 0;return s?P.success(s,{id:a,...r,...null==r?void 0:r.success}):P.dismiss(a),e}).catch(e=>{let s=t.error?y(t.error,e):void 0;s?P.error(s,{id:a,...r,...null==r?void 0:r.error}):P.dismiss(a)}),e};var A=1e3,N=(e,t="default")=>{let{toasts:r,pausedAt:a}=C(e,t),o=(0,s.useRef)(new Map).current,i=(0,s.useCallback)((e,t=A)=>{if(o.has(e))return;let r=setTimeout(()=>{o.delete(e),n({type:4,toastId:e})},t);o.set(e,r)},[]);(0,s.useEffect)(()=>{if(a)return;let e=Date.now(),s=r.map(r=>{if(r.duration===1/0)return;let a=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(a<0){r.visible&&P.dismiss(r.id);return}return setTimeout(()=>P.dismiss(r.id,t),a)});return()=>{s.forEach(e=>e&&clearTimeout(e))}},[r,a,t]);let n=(0,s.useCallback)(T(t),[t]),l=(0,s.useCallback)(()=>{n({type:5,time:Date.now()})},[n]),c=(0,s.useCallback)((e,t)=>{n({type:1,toast:{id:e,height:t}})},[n]),d=(0,s.useCallback)(()=>{a&&n({type:6,time:Date.now()})},[a,n]),u=(0,s.useCallback)((e,t)=>{let{reverseOrder:a=!1,gutter:s=8,defaultPosition:o}=t||{},i=r.filter(t=>(t.position||o)===(e.position||o)&&t.height),n=i.findIndex(t=>t.id===e.id),l=i.filter((e,t)=>t<n&&e.visible).length;return i.filter(e=>e.visible).slice(...a?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+s,0)},[r]);return(0,s.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)i(e.id,e.removeDelay);else{let t=o.get(e.id);t&&(clearTimeout(t),o.delete(e.id))}})},[r,i]),{toasts:r,handlers:{updateHeight:c,startPause:l,endPause:d,calculateOffset:u}}},j=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,I=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,O=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,D=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${j} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${O} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,H=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,M=v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${H} 1s linear infinite;
`,z=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,X=g`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,B=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${X} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,F=v("div")`
  position: absolute;
`,V=v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,W=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,q=v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${W} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,K=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return void 0!==t?"string"==typeof t?s.createElement(q,null,t):t:"blank"===r?null:s.createElement(V,null,s.createElement(M,{...a}),"loading"!==r&&s.createElement(F,null,"error"===r?s.createElement(D,{...a}):s.createElement(B,{...a})))},J=v("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Y=v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Z=s.memo(({toast:e,position:t,style:r,children:a})=>{let o=e.height?((e,t)=>{let r=e.includes("top")?1:-1,[a,s]=w()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*r}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*r}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${g(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},i=s.createElement(K,{toast:e}),n=s.createElement(Y,{...e.ariaProps},y(e.message,e));return s.createElement(J,{className:e.className,style:{...o,...r,...e.style}},"function"==typeof a?a({icon:i,message:n}):s.createElement(s.Fragment,null,i,n))});a=s.createElement,c.p=void 0,f=a,m=void 0,h=void 0;var G=({id:e,className:t,style:r,onHeightUpdate:a,children:o})=>{let i=s.useCallback(t=>{if(t){let r=()=>{a(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return s.createElement("div",{ref:i,className:t,style:r},o)},Q=p`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ee=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:a,children:o,toasterId:i,containerStyle:n,containerClassName:l})=>{let{toasts:c,handlers:d}=N(r,i);return s.createElement("div",{"data-rht-toaster":i||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...n},className:l,onMouseEnter:d.startPause,onMouseLeave:d.endPause},c.map(r=>{let i,n,l=r.position||t,c=d.calculateOffset(r,{reverseOrder:e,gutter:a,defaultPosition:t}),u=(i=l.includes("top"),n=l.includes("center")?{justifyContent:"center"}:l.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:w()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${c*(i?1:-1)}px)`,...i?{top:0}:{bottom:0},...n});return s.createElement(G,{id:r.id,key:r.id,onHeightUpdate:d.updateHeight,className:r.visible?Q:"",style:u},"custom"===r.type?y(r.message,r):o?o(r):s.createElement(Z,{toast:r,position:l}))}))};e.s(["CheckmarkIcon",()=>B,"ErrorIcon",()=>D,"LoaderIcon",()=>M,"ToastBar",()=>Z,"ToastIcon",()=>K,"Toaster",()=>ee,"default",()=>P,"resolveValue",()=>y,"toast",()=>P,"useToaster",()=>N,"useToasterStore",()=>C],98992)}]);