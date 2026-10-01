export const $=(q,r=document)=>r.querySelector(q);
export const $$=(q,r=document)=>[...r.querySelectorAll(q)];

export const state={
  me:null,
  csrf:'',
  overview:null,
  guildId:'',
  guild:null,
  tab:'overview',
  members:[]
};

export const titles={
  overview:'Command Center',
  install:'Add Bot to Server',
  messages:'Messages',
  embed:'Embed Studio',
  media:'Media & Files',
  channels:'Channels',
  roles:'Roles',
  members:'Members',
  emojis:'Emojis & Reactions',
  presence:'Bot Presence',
  audit:'Audit Log'
};

export const sections={
  overview:'COMMAND',
  install:'COMMAND',
  messages:'COMMAND',
  embed:'COMMAND',
  media:'COMMAND',
  channels:'SERVER',
  roles:'SERVER',
  members:'SERVER',
  emojis:'SERVER',
  presence:'SYSTEM',
  audit:'SYSTEM'
};

export function esc(v=''){
  return String(v)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;');
}

export function toast(msg){
  const el=$('#toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>el.classList.remove('show'),2400);
}

export async function api(path,options={}){
  const headers=new Headers(options.headers||{});
  if(!(options.body instanceof FormData))headers.set('content-type','application/json');
  if(state.csrf&&!['GET','HEAD'].includes((options.method||'GET').toUpperCase())){
    headers.set('x-csrf-token',state.csrf);
  }
  const res=await fetch(path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(res.status===401){
    showLogin();
    throw new Error(data.error||'Login required');
  }
  if(!res.ok)throw new Error(data.error||`Request failed (${res.status})`);
  return data;
}

export function showLogin(){
  $('#login').classList.remove('hidden');
  $('#app').classList.add('hidden');
}

export function showApp(){
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
}

export function channelOptions(textOnly=true){
  return (state.guild?.channels||[])
    .filter(c=>!textOnly||c.textBased)
    .filter(c=>c.type!==4)
    .map(c=>`<option value="${c.id}"># ${esc(c.name)}</option>`)
    .join('');
}

export function categoryOptions(){
  return '<option value="">No category</option>'+
    (state.guild?.channels||[])
      .filter(c=>c.type===4)
      .map(c=>`<option value="${c.id}">${esc(c.name)}</option>`)
      .join('');
}

export function roleOptions(){
  return (state.guild?.roles||[])
    .map(r=>`<option value="${r.id}">${esc(r.name)}</option>`)
    .join('');
}

export async function confirmAction(title,text){
  return new Promise(resolve=>{
    const modal=$('#confirm');
    $('#confirmTitle').textContent=title;
    $('#confirmText').textContent=text;
    modal.classList.remove('hidden');
    const done=value=>{
      modal.classList.add('hidden');
      $('#confirmOk').onclick=null;
      $('#confirmCancel').onclick=null;
      resolve(value);
    };
    $('#confirmOk').onclick=()=>done(true);
    $('#confirmCancel').onclick=()=>done(false);
  });
}

export async function loadMe(){
  try{
    const data=await api('/api/me');
    state.me=data;
    state.csrf=data.csrf;
    showApp();

    $('#botName').textContent=data.bot.username||'RavenGPT';
    $('#botPing').textContent=data.bot.ready?`${data.bot.ping??'—'} ms • online`:'Connecting…';
    $('#botDot').classList.toggle('online',!!data.bot.ready);

    const botAvatar=$('#botAvatar');
    botAvatar.innerHTML=data.bot.avatar
      ? `<img src="${data.bot.avatar}" alt="">`
      : '<span>R</span>';

    $('#user').innerHTML=`
      ${data.user.avatar?`<img src="${data.user.avatar}" alt="">`:''}
      <span>${esc(data.user.globalName||data.user.username)}</span>
    `;
    return true;
  }catch{
    showLogin();
    return false;
  }
}

export async function loadOverview(){
  state.overview=await api('/api/overview');
  const options=state.overview.guilds
    .map(g=>`<option value="${g.id}">${esc(g.name)}</option>`)
    .join('');

  const desktop=$('#guildSelect');
  const mobile=$('#mobileGuildSelect');
  const empty='<option value="">No managed server</option>';

  desktop.innerHTML=options||empty;
  if(mobile)mobile.innerHTML=options||empty;

  if(!state.guildId||!state.overview.guilds.some(g=>g.id===state.guildId)){
    state.guildId=state.overview.guilds[0]?.id||'';
  }

  desktop.value=state.guildId;
  if(mobile)mobile.value=state.guildId;
  await loadGuild();
}

export async function loadGuild(){
  if(!state.guildId){
    state.guild=null;
    return;
  }
  state.guild=await api(`/api/guilds/${state.guildId}`);
}

export function metric(value,label,icon='◆'){
  return `<div class="stat-card">
    <div class="stat-top"><span class="stat-icon">${icon}</span><span class="stat-trend">LIVE</span></div>
    <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>
  </div>`;
}

export function field(label,body,full=false){
  return `<div class="field${full?' full':''}"><label>${label}</label>${body}</div>`;
}

export function setHeader(tab){
  $('#title').textContent=titles[tab]||'RavenGPT';
  $('#sectionLabel').textContent=sections[tab]||'COMMAND';
}

export function closeMobileNav(){
  $('#sidebar')?.classList.remove('open');
  $('#sidebarBackdrop')?.classList.remove('open');
}

export function openMobileNav(){
  $('#sidebar')?.classList.add('open');
  $('#sidebarBackdrop')?.classList.add('open');
}
