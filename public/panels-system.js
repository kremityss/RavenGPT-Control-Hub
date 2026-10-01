import {$,state,esc,toast,api,field} from './ui.js';

export function presencePanel(){
  const bot=state.me?.bot||{};
  $('#content').innerHTML=`
    <div class="install-layout">
      <section class="panel">
        <div class="section-head"><div><h3>Bot Presence</h3><p>Control how RavenGPT appears in Discord.</p></div><span class="badge good">${bot.ready?'ONLINE':'CONNECTING'}</span></div>
        <div class="form-grid">
          ${field('Status','<select id="presenceStatus"><option value="online">Online</option><option value="idle">Idle</option><option value="dnd">Do Not Disturb</option><option value="invisible">Invisible</option></select>')}
          ${field('Activity Type','<select id="presenceType"><option value="watching">Watching</option><option value="playing">Playing</option><option value="listening">Listening</option><option value="competing">Competing</option></select>')}
          ${field('Activity Text','<input id="presenceText" value="RavenGPT Command Center">',true)}
        </div>
        <div class="actions"><button class="btn btn-primary" id="setPresence">● Update Presence</button></div>
      </section>
      <section class="panel">
        <div class="panel-head"><div class="panel-title"><h3>Identity</h3><p>Current Discord gateway identity.</p></div></div>
        <div class="health-list">
          <div class="health-row"><span>Bot</span><b>${esc(bot.username||'RavenGPT')}</b></div>
          <div class="health-row"><span>Gateway</span><b class="health-state"><i></i>${bot.ready?'Connected':'Connecting'}</b></div>
          <div class="health-row"><span>Latency</span><b>${bot.ping??'—'} ms</b></div>
        </div>
      </section>
    </div>`;
  $('#setPresence').onclick=async()=>{
    try{
      await api('/api/presence',{method:'POST',body:JSON.stringify({status:$('#presenceStatus').value,type:$('#presenceType').value,text:$('#presenceText').value})});
      toast('Presence updated');
    }catch(e){toast(e.message);}
  };
}

export async function auditPanel(){
  $('#content').innerHTML='<section class="panel"><div class="section-head"><div><h3>Audit Log</h3><p>Loading RavenGPT activity…</p></div></div></section>';
  try{
    const data=await api('/api/audit');
    $('#content').innerHTML=`
      <section class="panel">
        <div class="section-head"><div><h3>Command Audit</h3><p>Recent actions performed through RavenGPT.</p></div><span class="badge">${data.rows.length} EVENTS</span></div>
        <div class="list">
          ${data.rows.map(r=>`<div class="item"><div class="item-main"><b>${esc(r.action.replaceAll('_',' '))}</b><span>${new Date(r.at).toLocaleString()} • ${esc(r.username||r.userId||'system')}</span></div><span class="badge">${esc(r.guildId||'SYSTEM')}</span></div>`).join('')||'<p>No dashboard actions recorded yet.</p>'}
        </div>
      </section>`;
  }catch(e){
    $('#content').innerHTML=`<section class="panel"><p>${esc(e.message)}</p></section>`;
  }
}
