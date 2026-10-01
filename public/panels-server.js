import {$,$$,state,esc,toast,api,categoryOptions,confirmAction,field} from './ui.js';

export function channelsPanel(reload){
  $('#content').innerHTML=`
    <div class="dashboard-grid">
      <section class="panel">
        <div class="section-head"><div><h3>Create Channel</h3><p>Create text, announcement, voice channels or categories.</p></div><span class="badge">SERVER</span></div>
        <div class="form-grid">
          ${field('Channel Name','<input id="channelName" placeholder="raven-updates">',true)}
          ${field('Type','<select id="channelType"><option value="text">Text</option><option value="announcement">Announcement</option><option value="voice">Voice</option><option value="category">Category</option></select>')}
          ${field('Category',`<select id="channelParent">${categoryOptions()}</select>`)}
          ${field('Topic','<input id="channelTopic" placeholder="Optional channel topic">',true)}
        </div>
        <div class="actions"><button class="btn btn-primary" id="createChannel">＋ Create Channel</button></div>
      </section>
      <section class="panel">
        <div class="section-head"><div><h3>Channel Map</h3><p>${state.guild?.channels?.length||0} channels visible to RavenGPT.</p></div></div>
        <div class="list">
          ${(state.guild?.channels||[]).map(c=>`<div class="item"><div class="item-main"><b>${c.type===4?'▾':'#'} ${esc(c.name)}</b><span>${c.type===4?'Category':'Channel'} • ${c.id}</span></div><button class="btn btn-danger delete-channel" data-id="${c.id}" data-name="${esc(c.name)}">Delete</button></div>`).join('')||'<p>No channels returned.</p>'}
        </div>
      </section>
    </div>`;

  $('#createChannel').onclick=async()=>{
    const name=$('#channelName').value.trim();
    if(!name)return toast('Enter a channel name');
    try{
      await api('/api/channels',{method:'POST',body:JSON.stringify({guildId:state.guildId,name,type:$('#channelType').value,parentId:$('#channelParent').value,topic:$('#channelTopic').value})});
      toast('Channel created');await reload();channelsPanel(reload);
    }catch(e){toast(e.message);}
  };
  $$('.delete-channel').forEach(b=>b.onclick=async()=>{
    if(!await confirmAction('Delete channel?',`Delete #${b.dataset.name}? This cannot be undone.`))return;
    try{await api(`/api/channels/${state.guildId}/${b.dataset.id}`,{method:'DELETE'});toast('Channel deleted');await reload();channelsPanel(reload);}catch(e){toast(e.message);}
  });
}

export function rolesPanel(reload){
  $('#content').innerHTML=`
    <div class="dashboard-grid">
      <section class="panel">
        <div class="section-head"><div><h3>Create Role</h3><p>Create a server role through RavenGPT.</p></div><span class="badge">ACCESS</span></div>
        <div class="form-grid">
          ${field('Role Name','<input id="roleName" placeholder="Raven Member">',true)}
          ${field('Color','<input id="roleColor" type="color" value="#9d5cff">')}
          ${field('Mentionable','<select id="roleMentionable"><option value="false">No</option><option value="true">Yes</option></select>')}
        </div>
        <div class="actions"><button class="btn btn-primary" id="createRole">＋ Create Role</button></div>
      </section>
      <section class="panel">
        <div class="section-head"><div><h3>Role Stack</h3><p>Role hierarchy controls what RavenGPT can assign.</p></div></div>
        <div class="list">
          ${(state.guild?.roles||[]).map(r=>`<div class="item"><div class="item-main"><b style="color:${r.color}">◆ ${esc(r.name)}</b><span>Position ${r.position} • ${r.id}</span></div><button class="btn btn-danger delete-role" data-id="${r.id}" data-name="${esc(r.name)}">Delete</button></div>`).join('')||'<p>No manageable roles returned.</p>'}
        </div>
      </section>
    </div>`;

  $('#createRole').onclick=async()=>{
    const name=$('#roleName').value.trim();
    if(!name)return toast('Enter a role name');
    try{
      await api('/api/roles',{method:'POST',body:JSON.stringify({guildId:state.guildId,name,color:$('#roleColor').value,mentionable:$('#roleMentionable').value==='true'})});
      toast('Role created');await reload();rolesPanel(reload);
    }catch(e){toast(e.message);}
  };
  $$('.delete-role').forEach(b=>b.onclick=async()=>{
    if(!await confirmAction('Delete role?',`Delete ${b.dataset.name}?`))return;
    try{await api(`/api/roles/${state.guildId}/${b.dataset.id}`,{method:'DELETE'});toast('Role deleted');await reload();rolesPanel(reload);}catch(e){toast(e.message);}
  });
}
