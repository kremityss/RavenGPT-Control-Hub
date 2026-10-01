export const $=(q,r=document)=>r.querySelector(q);
export const $$=(q,r=document)=>[...r.querySelectorAll(q)];

export const state={me:null,csrf:'',overview:null,guildId:'',guild:null,tab:'overview',members:[]};

export const titles={overview:'Overview',messages:'Messages',embed:'Embed Studio',media:'Media & Files',reactions:'Reactions & Emojis',channels:'Channels',roles:'Roles',members:'Members',presence:'Bot Presence',audit:'Audit Log'};

export function esc(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}

export function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2200);}

export async function api(path,options={}){
  const headers=new Headers(options.headers||{});
  if(!(options.body instanceof FormData))headers.set('content-type','application/json');
  if(state.csrf&&!['GET','HEAD'].includes((options.method||'GET').toUpperCase()))headers.set('x-csrf-token',state.csrf);
  const res=await fetch(path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(res.status===401){showLogin();throw new Error(data.error||'Login required');}
  if(!res.ok)throw new Error(data.error||`Request failed (${res.status})`);
  return data;
}

export function showLogin(){$('#login').classList.remove('hidden');$('#app').classList.add('hidden');}
export function showApp(){$('#login').classList.add('hidden');$('#app').classList.remove('hidden');}

export function channelOptions(textOnly=true){return (state.guild?.channels||[]).filter(c=>!textOnly||c.textBased).filter(c=>c.type!==4).map(c=>`<option value="${c.id}"># ${esc(c.name)}</option>`).join('');}
export function categoryOptions(){return `<option value="">No category</option>`+(state.guild?.channels||[]).filter(c=>c.type===4).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');}
export function roleOptions(){return (state.guild?.roles||[]).map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');}

export async function confirmAction(title,text){return new Promise(resolve=>{const modal=$('#confirm');$('#confirmTitle').textContent=title;$('#confirmText').textContent=text;modal.classList.remove('hidden');const done=v=>{modal.classList.add('hidden');$('#confirmOk').onclick=null;$('#confirmCancel').onclick=null;resolve(v);};$('#confirmOk').onclick=()=>done(true);$('#confirmCancel').onclick=()=>done(false);});}

export async function loadMe(){try{const data=await api('/api/me');state.me=data;state.csrf=data.csrf;showApp();$('#botName').textContent=data.bot.username;$('#botPing').textContent=`${data.bot.ping??'—'} ms`;$('#botDot').classList.toggle('online',!!data.bot.ready);$('#user').innerHTML=`${data.user.avatar?`<img src="${data.user.avatar}" alt="">`:''}<span>${esc(data.user.globalName||data.user.username)}</span>`;return true;}catch{showLogin();return false;}}

export async function loadOverview(){state.overview=await api('/api/overview');const select=$('#guildSelect');select.innerHTML=state.overview.guilds.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');if(!state.guildId||!state.overview.guilds.some(g=>g.id===state.guildId))state.guildId=state.overview.guilds[0]?.id||'';select.value=state.guildId;if(state.guildId)await loadGuild();}
export async function loadGuild(){if(!state.guildId){state.guild=null;return;}state.guild=await api(`/api/guilds/${state.guildId}`);}

export function metric(value,label){return `<div class="card quarter"><div class="metric">${value}</div><div class="metric-label">${label}</div></div>`;}
export function field(label,body,full=false){return `<div class="field${full?' full':''}"><label>${label}</label>${body}</div>`;}
