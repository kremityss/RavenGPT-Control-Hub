import {$,$$,state,esc,toast,api,channelOptions,confirmAction,field} from './ui.js';

export function messagesPanel(){
  $('#content').innerHTML=`
    <div class="dashboard-grid">
      <section class="panel">
        <div class="section-head"><div><h3>Message Composer</h3><p>Send text, links and mentions through RavenGPT.</p></div><span class="badge good">READY</span></div>
        <div class="form-grid">
          ${field('Channel',`<select id="msgChannel">${channelOptions()}</select>`,true)}
          ${field('Mentions','<select id="msgMentions"><option value="false">Block automatic mentions</option><option value="true">Allow user / role mentions</option></select>',true)}
          ${field('Message','<textarea id="msgContent" placeholder="Write your Discord message here…"></textarea>',true)}
        </div>
        <div class="actions"><button class="btn btn-primary" id="sendMessage">✦ Send Message</button><button class="btn btn-ghost" id="clearMessage">Clear</button></div>
      </section>
      <section class="panel">
        <div class="section-head"><div><h3>Channel Feed</h3><p>Recent messages from the selected channel.</p></div><button class="btn btn-ghost" id="loadRecent">Refresh Feed</button></div>
        <div id="recentMessages" class="list"><p>Select a channel and load its recent messages.</p></div>
      </section>
    </div>`;

  $('#sendMessage').onclick=async()=>{
    const content=$('#msgContent').value.trim();
    if(!content)return toast('Write a message first');
    try{
      await api('/api/messages/send',{method:'POST',body:JSON.stringify({
        guildId:state.guildId,channelId:$('#msgChannel').value,content,
        allowMentions:$('#msgMentions').value==='true'
      })});
      $('#msgContent').value='';
      toast('Message sent');
      await loadRecent();
    }catch(e){toast(e.message);}
  };
  $('#clearMessage').onclick=()=>{$('#msgContent').value='';};
  $('#loadRecent').onclick=loadRecent;
}

async function loadRecent(){
  const box=$('#recentMessages'),channelId=$('#msgChannel')?.value;
  if(!channelId)return toast('Choose a channel');
  box.innerHTML='<p>Loading messages…</p>';
  try{
    const data=await api(`/api/messages/${state.guildId}/${channelId}?limit=25`);
    box.innerHTML=data.messages.map(m=>`
      <div class="item">
        <div class="item-main"><b>${esc(m.author.username)} ${m.author.bot?'• BOT':''}</b><span>${esc(m.content||`[${m.embeds} embed(s) • ${m.attachments.length} attachment(s)]`)}</span></div>
        <div class="item-actions">
          ${m.author.id===state.me.bot.id?`<button class="btn btn-ghost edit-msg" data-id="${m.id}">Edit</button>`:''}
          <button class="btn btn-danger del-msg" data-id="${m.id}">Delete</button>
        </div>
      </div>`).join('')||'<p>No messages returned.</p>';

    $$('.del-msg').forEach(b=>b.onclick=async()=>{
      if(!await confirmAction('Delete message?','This removes the selected Discord message.'))return;
      try{await api(`/api/messages/${state.guildId}/${channelId}/${b.dataset.id}`,{method:'DELETE'});toast('Message deleted');await loadRecent();}catch(e){toast(e.message);}
    });
    $$('.edit-msg').forEach(b=>b.onclick=async()=>{
      const content=prompt('New message text:'); if(content==null)return;
      try{await api(`/api/messages/${state.guildId}/${channelId}/${b.dataset.id}`,{method:'PATCH',body:JSON.stringify({content})});toast('Message edited');await loadRecent();}catch(e){toast(e.message);}
    });
  }catch(e){box.innerHTML=`<p>${esc(e.message)}</p>`;}
}

export function embedPanel(){
  $('#content').innerHTML=`
    <div class="dashboard-grid">
      <section class="panel">
        <div class="section-head"><div><h3>Raven Embed Studio</h3><p>Create rich branded Discord cards.</p></div><span class="badge">EMBED</span></div>
        <div class="form-grid">
          ${field('Channel',`<select id="embedChannel">${channelOptions()}</select>`,true)}
          ${field('Title','<input id="embedTitle" placeholder="RavenGPT Update">')}
          ${field('Accent','<input id="embedColor" type="color" value="#9d5cff">')}
          ${field('Description','<textarea id="embedDesc" placeholder="Write the embed body…"></textarea>',true)}
          ${field('Author','<input id="embedAuthor" placeholder="RavenGPT">')}
          ${field('Footer','<input id="embedFooter" placeholder="Powered by RavenGPT">')}
          ${field('Image URL','<input id="embedImage" placeholder="https://…">')}
          ${field('Thumbnail URL','<input id="embedThumb" placeholder="https://…">')}
          ${field('Clickable URL','<input id="embedUrl" placeholder="https://…">',true)}
        </div>
        <div class="actions"><button class="btn btn-primary" id="sendEmbed">▣ Send Embed</button><button class="btn btn-ghost" id="resetEmbed">Reset</button></div>
      </section>
      <section class="panel">
        <div class="section-head"><div><h3>Live Preview</h3><p>Approximate Discord presentation.</p></div></div>
        <div id="embedPreview" class="embed-preview"><h4>RavenGPT Update</h4><p>Your description will preview here.</p></div>
      </section>
    </div>`;

  const update=()=>{
    const p=$('#embedPreview');
    p.style.borderLeftColor=$('#embedColor').value;
    p.innerHTML=`<h4>${esc($('#embedTitle').value||'RavenGPT Update')}</h4><p>${esc($('#embedDesc').value||'Your description will preview here.')}</p>`;
  };
  ['embedTitle','embedColor','embedDesc'].forEach(id=>$(`#${id}`).addEventListener('input',update));
  $('#resetEmbed').onclick=()=>{['embedTitle','embedDesc','embedAuthor','embedFooter','embedImage','embedThumb','embedUrl'].forEach(id=>$(`#${id}`).value='');$('#embedColor').value='#9d5cff';update();};
  $('#sendEmbed').onclick=async()=>{
    try{
      await api('/api/messages/embed',{method:'POST',body:JSON.stringify({
        guildId:state.guildId,channelId:$('#embedChannel').value,title:$('#embedTitle').value,
        description:$('#embedDesc').value,color:$('#embedColor').value,author:$('#embedAuthor').value,
        footer:$('#embedFooter').value,image:$('#embedImage').value,thumbnail:$('#embedThumb').value,url:$('#embedUrl').value
      })});
      toast('Embed sent');
    }catch(e){toast(e.message);}
  };
}
