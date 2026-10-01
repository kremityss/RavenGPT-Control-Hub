import {$,$$,state,esc,toast,api,confirmAction,field} from './ui.js';

export async function membersPanel(){
  $('#content').innerHTML='<section class="panel"><div class="section-head"><div><h3>Member Control</h3><p>Loading members…</p></div></div></section>';
  try{
    const data=await api(`/api/members/${state.guildId}`);
    state.members=data.members;
    $('#content').innerHTML=`
      <section class="panel">
        <div class="section-head"><div><h3>Member Control</h3><p>Search, assign roles and run moderation actions.</p></div><span class="badge">${data.members.length} LOADED</span></div>
        ${field('Search Members','<input id="memberSearch" placeholder="Search username or display name">',true)}
        <div id="memberList" class="list" style="margin-top:12px"></div>
      </section>`;
    paint();
    $('#memberSearch').oninput=paint;
  }catch(e){$('#content').innerHTML=`<section class="panel"><p>${esc(e.message)}</p></section>`;}
}

function paint(){
  const q=($('#memberSearch')?.value||'').toLowerCase();
  const list=state.members.filter(m=>`${m.username} ${m.displayName}`.toLowerCase().includes(q)).slice(0,100);
  $('#memberList').innerHTML=list.map(m=>`
    <div class="item">
      <div class="member-main"><img class="avatar" src="${m.avatar}" alt=""><div class="item-main"><b>${esc(m.displayName)}</b><span>@${esc(m.username)} • ${m.roles.length} role(s)${m.bot?' • BOT':''}</span></div></div>
      <div class="item-actions">
        <button class="btn btn-ghost member-role" data-id="${m.id}" data-mode="add">＋ Role</button>
        <button class="btn btn-ghost member-role" data-id="${m.id}" data-mode="remove">− Role</button>
        <button class="btn btn-ghost member-action" data-id="${m.id}" data-action="timeout">Timeout</button>
        <button class="btn btn-danger member-action" data-id="${m.id}" data-action="kick">Kick</button>
        <button class="btn btn-danger member-action" data-id="${m.id}" data-action="ban">Ban</button>
      </div>
    </div>`).join('')||'<p>No members match your search.</p>';

  $$('.member-action').forEach(b=>b.onclick=async()=>{
    const action=b.dataset.action;
    if(!await confirmAction(`${action.toUpperCase()} member?`,`Apply ${action} to this member?`))return;
    let durationMinutes=10;
    if(action==='timeout')durationMinutes=Number(prompt('Timeout length in minutes:','10')||10);
    try{
      await api('/api/members/action',{method:'POST',body:JSON.stringify({guildId:state.guildId,userId:b.dataset.id,action,durationMinutes,reason:'Action from RavenGPT Command Center'})});
      toast(`${action} applied`);await membersPanel();
    }catch(e){toast(e.message);}
  });

  $$('.member-role').forEach(b=>b.onclick=async()=>{
    const roleId=prompt(`Role ID to ${b.dataset.mode}:\n\n${(state.guild?.roles||[]).map(r=>`${r.name}: ${r.id}`).join('\n')}`);
    if(!roleId)return;
    try{await api('/api/members/role',{method:'POST',body:JSON.stringify({guildId:state.guildId,userId:b.dataset.id,roleId,mode:b.dataset.mode})});toast(`Role ${b.dataset.mode==='add'?'added':'removed'}`);}catch(e){toast(e.message);}
  });
}
