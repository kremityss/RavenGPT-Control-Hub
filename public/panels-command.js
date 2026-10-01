import {$,$$,state,esc,toast,api,metric} from './ui.js';

const activeGuild=()=>state.overview?.guilds?.find(g=>g.id===state.guildId)||null;

async function installBot(){
  try{
    const x=await api('/api/invite');
    location.href=x.url;
  }catch(e){toast(e.message);}
}

export function overviewPanel(openTab){
  const t=state.overview?.totals||{};
  const g=activeGuild();
  const bot=state.me?.bot||{};
  $('#content').innerHTML=`
    <section class="hero">
      <div class="hero-side">
        <div class="live-pill">BOT <b>${bot.ready?'ONLINE':'CONNECTING'}</b></div>
        <div class="live-pill">PING <b>${bot.ping??'—'} ms</b></div>
      </div>
      <span class="hero-kicker"><i></i> RAVENGPT CONTROL PLANE</span>
      <h1>Discord control,<br><span>the Raven way.</span></h1>
      <p>${g?`Connected to ${esc(g.name)}. Send content, manage the server and control RavenGPT from one workspace.`:'RavenGPT is online. Add it to a Discord server to unlock the full command center.'}</p>
      <div class="hero-actions">
        <button class="btn btn-primary" id="heroInstall">＋ Add RavenGPT to Server</button>
        ${g?'<button class="btn btn-ghost" id="heroMessage">✦ Send Message</button>':''}
      </div>
    </section>
    <section class="stats-grid">
      ${metric(t.guilds||0,'MANAGED SERVERS','◇')}
      ${metric(t.members||0,'TOTAL MEMBERS','◎')}
      ${metric(t.channels||0,'TOTAL CHANNELS','#')}
      ${metric(`${t.ping??'—'}<small> ms</small>`,'GATEWAY LATENCY','↯')}
    </section>
    <section class="dashboard-grid">
      <div class="panel">
        <div class="panel-head"><div class="panel-title"><h3>Quick Controls</h3><p>Jump into RavenGPT actions.</p></div><span class="badge good">LIVE</span></div>
        <div class="quick-grid">
          <button class="quick-action" data-open="messages"><b>✦ Message Center</b><span>Send text, links and manage recent messages.</span></button>
          <button class="quick-action" data-open="embed"><b>▣ Embed Studio</b><span>Build branded embeds with live preview.</span></button>
          <button class="quick-action" data-open="media"><b>↑ Media & Files</b><span>Upload photos, video, ZIPs and documents.</span></button>
          <button class="quick-action" data-open="members"><b>◎ Members</b><span>Roles, timeouts, kicks and bans.</span></button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title"><h3>System Health</h3><p>Live control-plane state.</p></div></div>
        <div class="health-list">
          <div class="health-row"><span>Discord gateway</span><b class="health-state"><i></i>${bot.ready?'Connected':'Connecting'}</b></div>
          <div class="health-row"><span>Bot identity</span><b>${esc(bot.username||'RavenGPT')}</b></div>
          <div class="health-row"><span>Selected server</span><b>${g?esc(g.name):'None'}</b></div>
          <div class="health-row"><span>Dashboard session</span><b class="health-state"><i></i>Secure</b></div>
        </div>
      </div>
    </section>`;
  $('#heroInstall').onclick=()=>openTab('install');
  $('#heroMessage')?.addEventListener('click',()=>openTab('messages'));
  $$('.quick-action').forEach(b=>b.onclick=()=>openTab(b.dataset.open));
}

export function installPanel(){
  const bot=state.me?.bot||{};
  $('#content').innerHTML=`
    <div class="install-layout">
      <section class="install-hero">
        <div class="raven-mark large"><span>R</span></div>
        <div class="overline">RAVENGPT INSTALLATION</div>
        <h1>Add <span>RavenGPT</span><br>to your server.</h1>
        <p>Authorize RavenGPT for a server you manage. Discord lets you choose the server and review every requested permission first.</p>
        <div class="install-actions">
          <button id="installBot" class="btn btn-primary">＋ Add RavenGPT to Server <strong>→</strong></button>
          <button id="reauthorizeBot" class="btn btn-ghost">Re-authorize Permissions</button>
        </div>
        <div class="health-row" style="margin-top:22px;max-width:470px"><span>Bot status</span><b class="health-state"><i></i>${bot.ready?'Online • '+esc(bot.username||'RavenGPT'):'Connecting'}</b></div>
      </section>
      <div>
        <section class="panel">
          <div class="panel-head"><div class="panel-title"><h3>Requested Capabilities</h3><p>Controls used by this dashboard.</p></div></div>
          <div class="permission-list">
            <div class="permission"><i>✦</i><div><b>Messages & Embeds</b><span>Send messages, links, embeds and reactions.</span></div></div>
            <div class="permission"><i>↑</i><div><b>Files & Media</b><span>Upload Discord-supported media and files.</span></div></div>
            <div class="permission"><i>#</i><div><b>Channels & Roles</b><span>Create, manage and remove server channels and roles.</span></div></div>
            <div class="permission"><i>◎</i><div><b>Member Moderation</b><span>Timeout, kick and ban when you trigger those actions.</span></div></div>
            <div class="permission"><i>☺</i><div><b>Server Emojis</b><span>Create and manage custom server emojis.</span></div></div>
          </div>
        </section>
        <section class="panel" style="margin-top:12px">
          <div class="panel-head"><div class="panel-title"><h3>Install Flow</h3><p>Handled securely by Discord.</p></div></div>
          <div class="install-step"><i>01</i><div><b>Choose your server</b><span>Select a server where you can install apps.</span></div></div>
          <div class="install-step"><i>02</i><div><b>Review permissions</b><span>Discord shows the permissions before authorization.</span></div></div>
          <div class="install-step"><i>03</i><div><b>Return to RavenGPT</b><span>Refresh the dashboard and select the new server.</span></div></div>
        </section>
      </div>
    </div>`;
  $('#installBot').onclick=installBot;
  $('#reauthorizeBot').onclick=installBot;
}
