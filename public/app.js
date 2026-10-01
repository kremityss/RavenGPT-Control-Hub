import {
  $,$$,state,toast,api,loadMe,loadOverview,loadGuild,
  setHeader,openMobileNav,closeMobileNav
} from './ui.js';
import {
  overviewTab,installTab,messagesTab,embedTab,mediaTab,emojisTab
} from './tabs-core.js';
import {
  channelsTab,rolesTab,membersTab,presenceTab,auditTab
} from './tabs-admin.js';

async function render(){
  setHeader(state.tab);

  const guildRequired=['messages','embed','media','channels','roles','members','emojis'];
  if(!state.guildId&&guildRequired.includes(state.tab)){
    $('#content').innerHTML=`
      <div class="install-layout">
        <section class="install-hero">
          <div class="raven-mark large"><span>R</span></div>
          <div class="overline">NO SERVER CONNECTED</div>
          <h1>Add <span>RavenGPT</span> to a server.</h1>
          <p>This control requires a Discord server where RavenGPT is installed and your account has Manage Server or Administrator permission.</p>
          <div class="install-actions">
            <button class="btn btn-primary" id="emptyInstall">Add RavenGPT to Server <strong>→</strong></button>
          </div>
        </section>
      </div>`;
    $('#emptyInstall').onclick=()=>switchTab('install');
    return;
  }

  const reload=async()=>{await loadGuild();};

  if(state.tab==='overview')overviewTab(switchTab);
  if(state.tab==='install')installTab();
  if(state.tab==='messages')messagesTab();
  if(state.tab==='embed')embedTab();
  if(state.tab==='media')mediaTab();
  if(state.tab==='channels')channelsTab(reload);
  if(state.tab==='roles')rolesTab(reload);
  if(state.tab==='members')await membersTab();
  if(state.tab==='emojis')emojisTab(reload);
  if(state.tab==='presence')presenceTab();
  if(state.tab==='audit')await auditTab();
}

async function switchTab(tab){
  state.tab=tab;
  $$('#nav .nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  closeMobileNav();
  await render();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function changeGuild(value){
  state.guildId=value;
  $('#guildSelect').value=value;
  if($('#mobileGuildSelect'))$('#mobileGuildSelect').value=value;
  try{
    await loadGuild();
    await render();
  }catch(e){
    toast(e.message);
  }
}

async function boot(){
  if(!await loadMe())return;

  try{
    await loadOverview();
    await render();
  }catch(e){
    toast(e.message);
  }

  $('#guildSelect').onchange=()=>changeGuild($('#guildSelect').value);
  if($('#mobileGuildSelect')){
    $('#mobileGuildSelect').onchange=()=>changeGuild($('#mobileGuildSelect').value);
  }

  $$('#nav .nav-item').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));

  $('#openSidebar').onclick=openMobileNav;
  $('#closeSidebar').onclick=closeMobileNav;
  $('#sidebarBackdrop').onclick=closeMobileNav;

  $('#refresh').onclick=async()=>{
    try{
      await loadOverview();
      await render();
      toast('RavenGPT refreshed');
    }catch(e){
      toast(e.message);
    }
  };

  $('#logout').onclick=async()=>{
    try{
      await api('/auth/logout',{method:'POST',body:JSON.stringify({})});
      location.reload();
    }catch(e){
      toast(e.message);
    }
  };
}

boot();
