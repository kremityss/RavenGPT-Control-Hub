import {$,$$,state,toast,api,loadMe,loadOverview,loadGuild,setHeader,openMobileNav,closeMobileNav} from './ui.js';
import {overviewPanel,installPanel} from './panels-command.js';
import {messagesPanel,embedPanel} from './panels-content.js';
import {mediaPanel,emojisPanel} from './panels-media.js';
import {channelsPanel,rolesPanel} from './panels-server.js';
import {membersPanel} from './panels-members.js';
import {presencePanel,auditPanel} from './panels-system.js';

async function render(){
  setHeader(state.tab);
  const needsGuild=['messages','embed','media','channels','roles','members','emojis'];
  if(!state.guildId&&needsGuild.includes(state.tab)){
    $('#content').innerHTML=`
      <div class="install-layout">
        <section class="install-hero">
          <div class="raven-mark large"><span>R</span></div>
          <div class="overline">SERVER REQUIRED</div>
          <h1>Connect <span>RavenGPT</span><br>to a server.</h1>
          <p>This control needs a Discord server where RavenGPT is installed and your account has Manage Server or Administrator access.</p>
          <div class="install-actions"><button class="btn btn-primary" id="emptyInstall">＋ Add RavenGPT to Server</button></div>
        </section>
      </div>`;
    $('#emptyInstall').onclick=()=>switchTab('install');
    return;
  }

  const reload=async()=>{await loadGuild();};
  if(state.tab==='overview')overviewPanel(switchTab);
  if(state.tab==='install')installPanel();
  if(state.tab==='messages')messagesPanel();
  if(state.tab==='embed')embedPanel();
  if(state.tab==='media')mediaPanel();
  if(state.tab==='channels')channelsPanel(reload);
  if(state.tab==='roles')rolesPanel(reload);
  if(state.tab==='members')await membersPanel();
  if(state.tab==='emojis')emojisPanel(reload);
  if(state.tab==='presence')presencePanel();
  if(state.tab==='audit')await auditPanel();
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
  try{await loadGuild();await render();}catch(e){toast(e.message);}
}

async function boot(){
  if(!await loadMe())return;
  try{await loadOverview();await render();}catch(e){toast(e.message);}

  $('#guildSelect').onchange=()=>changeGuild($('#guildSelect').value);
  if($('#mobileGuildSelect'))$('#mobileGuildSelect').onchange=()=>changeGuild($('#mobileGuildSelect').value);
  $$('#nav .nav-item').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));

  $('#openSidebar').onclick=openMobileNav;
  $('#closeSidebar').onclick=closeMobileNav;
  $('#sidebarBackdrop').onclick=closeMobileNav;

  $('#refresh').onclick=async()=>{
    try{await loadOverview();await render();toast('RavenGPT refreshed');}catch(e){toast(e.message);}
  };

  $('#logout').onclick=async()=>{
    try{await api('/auth/logout',{method:'POST',body:JSON.stringify({})});location.reload();}catch(e){toast(e.message);}
  };
}
boot();
