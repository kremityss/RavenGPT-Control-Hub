import {$,$$,state,titles,toast,api,loadMe,loadOverview,loadGuild} from './ui.js';
import {overviewTab,messagesTab,embedTab,mediaTab,reactionsTab} from './tabs-core.js';
import {channelsTab,rolesTab,membersTab,presenceTab,auditTab} from './tabs-admin.js';

async function render(){
  $('#title').textContent=titles[state.tab]||'RavenGPT';
  if(!state.guildId&&!['presence','audit'].includes(state.tab)){
    $('#content').innerHTML='<div class="card full"><h3>No manageable server found</h3><p>Add the bot to a server where your Discord account has Manage Server or Administrator.</p></div>';
    return;
  }
  const reload=async()=>{await loadGuild();};
  if(state.tab==='overview')overviewTab(switchTab);
  if(state.tab==='messages')messagesTab();
  if(state.tab==='embed')embedTab();
  if(state.tab==='media')mediaTab();
  if(state.tab==='reactions')reactionsTab();
  if(state.tab==='channels')channelsTab(reload);
  if(state.tab==='roles')rolesTab(reload);
  if(state.tab==='members')await membersTab();
  if(state.tab==='presence')presenceTab();
  if(state.tab==='audit')await auditTab();
}

async function switchTab(tab){state.tab=tab;$$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));await render();}

async function boot(){
  if(!await loadMe())return;
  try{await loadOverview();await render();}catch(e){toast(e.message);}
  $('#guildSelect').onchange=async()=>{state.guildId=$('#guildSelect').value;try{await loadGuild();await render();}catch(e){toast(e.message);}};
  $$('#nav button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $('#refresh').onclick=async()=>{try{await loadOverview();await render();toast('Refreshed');}catch(e){toast(e.message);}};
  $('#logout').onclick=async()=>{try{await api('/auth/logout',{method:'POST',body:JSON.stringify({})});location.reload();}catch(e){toast(e.message);}};
}

boot();
