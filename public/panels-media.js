import {$,$$,state,esc,toast,api,channelOptions,confirmAction,field} from './ui.js';

export function mediaPanel(){
  $('#content').innerHTML=`
    <section class="panel">
      <div class="section-head"><div><h3>Media & File Uplink</h3><p>Send photos, video, ZIPs and documents directly from your phone.</p></div><span class="badge">MAX 10 FILES</span></div>
      <div class="form-grid">
        ${field('Channel',`<select id="fileChannel">${channelOptions()}</select>`)}
        ${field('Caption','<input id="fileCaption" placeholder="Optional caption or link">')}
        ${field('Files','<div id="drop" class="drop">Tap to choose files<br><span class="hint">photos • videos • ZIPs • documents</span></div><input id="fileInput" type="file" multiple class="hidden"><div id="fileList" class="file-list"></div>',true)}
      </div>
      <div class="actions"><button class="btn btn-primary" id="sendFiles">↑ Upload to Discord</button><button class="btn btn-ghost" id="clearFiles">Clear</button></div>
    </section>`;

  const input=$('#fileInput'),drop=$('#drop');
  const paint=()=>{$('#fileList').innerHTML=[...input.files].map(f=>`<div class="file-pill"><span>${esc(f.name)}</span><span>${(f.size/1048576).toFixed(2)} MB</span></div>`).join('');};
  drop.onclick=()=>input.click();
  input.onchange=paint;
  ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag');}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag');}));
  drop.addEventListener('drop',e=>{input.files=e.dataTransfer.files;paint();});
  $('#clearFiles').onclick=()=>{input.value='';$('#fileList').innerHTML='';$('#fileCaption').value='';};
  $('#sendFiles').onclick=async()=>{
    if(!input.files.length)return toast('Choose at least one file');
    const fd=new FormData();
    fd.append('guildId',state.guildId);
    fd.append('channelId',$('#fileChannel').value);
    fd.append('content',$('#fileCaption').value);
    [...input.files].forEach(f=>fd.append('files',f));
    try{await api('/api/messages/files',{method:'POST',body:fd});toast('Files sent');input.value='';$('#fileList').innerHTML='';}catch(e){toast(e.message);}
  };
}

export function emojisPanel(reload){
  $('#content').innerHTML=`
    <div class="grid">
      <section class="card">
        <div class="section-head"><div><h3>Add Reaction</h3><p>React to an existing Discord message.</p></div></div>
        <div class="form-grid">
          ${field('Channel',`<select id="reactChannel">${channelOptions()}</select>`,true)}
          ${field('Message ID','<input id="reactMessage" placeholder="Discord message ID">',true)}
          ${field('Emoji','<input id="reactEmoji" placeholder="🔥 or custom emoji">',true)}
        </div>
        <div class="actions"><button class="btn btn-primary" id="addReaction">☺ Add Reaction</button></div>
      </section>
      <section class="card">
        <div class="section-head"><div><h3>Create Server Emoji</h3><p>Upload an image as a custom Discord emoji.</p></div></div>
        <div class="form-grid">
          ${field('Emoji Name','<input id="emojiName" placeholder="raven">',true)}
          ${field('Image','<input id="emojiFile" type="file" accept="image/*">',true)}
        </div>
        <div class="actions"><button class="btn btn-primary" id="createEmoji">＋ Create Emoji</button></div>
      </section>
      <section class="card full">
        <div class="section-head"><div><h3>Server Emoji Library</h3><p>Tap one to load it into the reaction composer.</p></div><span class="badge">${state.guild?.emojis?.length||0} EMOJIS</span></div>
        <div class="emoji-grid">
          ${(state.guild?.emojis||[]).map(e=>`<div class="emoji-wrap"><div class="emoji" data-text="${esc(e.text)}"><img src="${e.url}" alt=""><span>:${esc(e.name)}:</span></div><button class="btn btn-danger delete-emoji" data-id="${e.id}" data-name="${esc(e.name)}">Delete</button></div>`).join('')||'<p>No custom emojis on this server.</p>'}
        </div>
      </section>
    </div>`;

  $$('.emoji').forEach(e=>e.onclick=()=>{$('#reactEmoji').value=e.dataset.text;toast('Emoji selected');});
  $('#addReaction').onclick=async()=>{
    try{await api('/api/messages/react',{method:'POST',body:JSON.stringify({guildId:state.guildId,channelId:$('#reactChannel').value,messageId:$('#reactMessage').value,emoji:$('#reactEmoji').value})});toast('Reaction added');}catch(e){toast(e.message);}
  };
  $('#createEmoji').onclick=async()=>{
    const f=$('#emojiFile').files[0];
    if(!f)return toast('Choose an image');
    const fd=new FormData();fd.append('guildId',state.guildId);fd.append('name',$('#emojiName').value);fd.append('image',f);
    try{await api('/api/emojis',{method:'POST',body:fd});toast('Emoji created');await reload();emojisPanel(reload);}catch(e){toast(e.message);}
  };
  $$('.delete-emoji').forEach(b=>b.onclick=async()=>{
    if(!await confirmAction('Delete emoji?',`Delete :${b.dataset.name}: from this server?`))return;
    try{await api(`/api/emojis/${state.guildId}/${b.dataset.id}`,{method:'DELETE'});toast('Emoji deleted');await reload();emojisPanel(reload);}catch(e){toast(e.message);}
  });
}
