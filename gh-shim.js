// Silk Road — GitHub bridge (injected)
(function(){
const REPO="mbl68/VBAAAAuwh", FILE="k1532c945.txt", RAW="https://raw.githubusercontent.com/"+REPO+"/main/"+FILE;
const LS={get s(){return localStorage.gh_session||""},set s(v){v?localStorage.gh_session=v:localStorage.removeItem("gh_session")},get tok(){return (localStorage.gh_tok||"")},set tok(v){v?localStorage.gh_tok=v:localStorage.removeItem("gh_tok")}};
async function ghc(path,opt){opt=Object.assign({},opt);opt.headers=Object.assign({Authorization:"Bearer "+LS.tok,Accept:"application/vnd.github+json","Content-Type":"application/json"},opt.headers||{});const r=await fetch("https://api.github.com/repos/"+REPO+path,opt);if(!r.ok)throw new Error("GH"+r.status);return r.json()}
async function readKeys(){const t=await(await fetch("https://api.github.com/repos/"+REPO+"/contents/"+FILE,{headers:{Authorization:"Bearer "+LS.tok,Accept:"application/vnd.github.raw","Cache-Control":"no-cache"}})).text();return t.split("\n").filter(l=>l.trim()&&!l.startsWith("#"))}
async function writeKeys(lines,msg){const f=await ghc("/contents/"+FILE);const content=lines.join("\n")+"\n";await ghc("/contents/"+FILE,{method:"PUT",body:JSON.stringify({message:msg,content:btoa(unescape(encodeURIComponent(content))),sha:f.sha})})}
function today(){return new Date().toISOString().slice(0,10)}
function ok(data){return {result:{data:{json:data}}}}
function err(msg,code){return {error:{json:{code:-32000,message:msg,data:{code:code||"FORBIDDEN",httpStatus:403}}}}}
const captchas={};
const proc={
 "auth.me": async()=> ok({authenticated:!!LS.s}),
 "auth.logout": async()=>{LS.s="";return ok({ok:true})},
 "auth.login": async(inp)=>{const[cid,ans]=(inp.captchaToken||"").split(":");if(captchas[cid]===undefined||String(captchas[cid])!==String(ans||"").trim())throw{code:-32000,msg:"كابتشا غير صحيحة"};delete captchas[cid];
   const r=await fetch("https://api.github.com/user",{headers:{Authorization:"Bearer "+inp.password}});if(!r.ok)throw{code:-32000,msg:"باسورد الدخول يجب أن يكون توكن GitHub (github_pat_...)"};
   const u=await r.json();LS.tok=inp.password;LS.s=JSON.stringify({email:u.login});return ok({ok:true})},
 "keys.list": async()=>{const lines=await readKeys();const t=today();const rows=lines.map((l,i)=>{const a=l.split(":");const id=a[0],exp=(a[1]||"").replace(/\r/g,""),days=a[2]||"";const active=exp>=t;return{id:i+1,keyPreview:id.slice(0,6)+"···"+id.slice(-4),days:parseInt(days)||0,createdAt:exp,expiresAt:exp,status:active?"active":"expired",maxDevices:1,deviceCount:1,devices:[id]}}).reverse();return ok(rows)},
 "keys.create": async(inp)=>{const lines=await readKeys();const dev=(inp.deviceId||inp.key||"").trim();if(!dev)throw{code:-32000,msg:"Device ID مطلوب"};const d=inp.days||30;const exp=inp.expiresAt?String(inp.expiresAt).slice(0,10):new Date(Date.now()+d*864e5).toISOString().slice(0,10);await writeKeys([...lines,dev+":"+exp+":"+d],"create "+dev);return ok({ok:true})},
 "keys.remove": async(inp)=>{const lines=await readKeys();const i=(inp.id||0)-1;if(i<0||i>=lines.length)throw{code:-32000,msg:"غير موجود"};lines.splice(i,1);await writeKeys(lines,"remove #"+inp.id);return ok({ok:true})},
 "keys.unbindDevice": async(inp)=>{const lines=await readKeys();const i=(inp.id||0)-1;if(i>=0&&i<lines.length){lines.splice(i,1);await writeKeys(lines,"unbind "+inp.deviceId)}return ok({ok:true})},
 "keys.setStatus": async(inp)=>{if(inp.status==="suspended"){const lines=await readKeys();const i=(inp.id||0)-1;if(i>=0&&i<lines.length){lines.splice(i,1);await writeKeys(lines,"suspend #"+inp.id)}}return ok({ok:true})},
 "activity.list": async()=>ok([]),
 "scripts.list": async()=>ok([]),
 "so.list": async()=>ok([]),
 "stats.overview": async()=>{const lines=await readKeys();const t=today();const act=lines.filter(l=>(l.split(":")[1]||"")>=t).length;return ok({totalKeys:lines.length,activeKeys:act,expiredKeys:lines.length-act,devicesBound:lines.length,activeDevices:act,logins24h:0})},
};
const of=window.fetch;
window.fetch=async function(url,opt){
 try{
  const u=typeof url==="string"?url:url.url;
  if(u.endsWith("/api/auth/captcha")){const a=Math.floor(Math.random()*40)+3,b=Math.floor(Math.random()*40)+7;const cid=Math.random().toString(36).slice(2,10);captchas[cid]=a+b;return new Response(JSON.stringify({challengeId:cid,question:a+" + "+b+" = ?"}),{status:200,headers:{"Content-Type":"application/json"}})}
  const m=u.match(/\/api\/trpc\/([a-zA-Z0-9_.]+)/);
  if(m){const name=m[1];const isMut=(opt&&opt.method==="POST");
   let input={};if(isMut&&opt.body){try{const b=JSON.parse(opt.body);input=(b["0"]&&b["0"].json)||{}}catch(e){}}
   else{try{const q=new URL(u,"http://x").searchParams.get("input");if(q)input=(JSON.parse(q)["0"]||{}).json||{}}catch(e){}}
   const p=proc[name];if(!p)return new Response(JSON.stringify([err("غير مدعوم: "+name)]),{status:200,headers:{"Content-Type":"application/json"}});
   try{const r=await p(input||{});return new Response(JSON.stringify(isMut?[r]:[r]),{status:200,headers:{"Content-Type":"application/json"}})}
   catch(e){const er=err(e.msg||"خطأ",e.code);return new Response(JSON.stringify([er]),{status:200,headers:{"Content-Type":"application/json"}})}}
 }catch(e){}
 return of.apply(this,arguments);
};
})();
