import { ActivityType, ChannelType } from 'discord.js';
import { audit, cfg, clampText, readAudit, requireAuth, requireCsrf, requireGuild } from './core.js';

export function mountAdminRoutes(app, upload) {
  app.post('/api/channels', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try {
      const map={text:ChannelType.GuildText,voice:ChannelType.GuildVoice,category:ChannelType.GuildCategory,announcement:ChannelType.GuildAnnouncement};
      const c=await req.guild.channels.create({
        name:clampText(req.body.name,100), type:map[req.body.type]??ChannelType.GuildText,
        parent:req.body.parentId||undefined,
        topic:['text','announcement'].includes(req.body.type)?clampText(req.body.topic,1024):undefined,
        reason:cfg.panelName,
      });
      audit(req,'create_channel',{guildId:req.guild.id,channelId:c.id,name:c.name}); res.json({ok:true});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.delete('/api/channels/:guildId/:channelId', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try { const c=req.guild.channels.cache.get(req.params.channelId); if(!c)throw new Error('Channel not found'); await c.delete(cfg.panelName); audit(req,'delete_channel',{guildId:req.guild.id,channelId:c.id}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/roles', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try { const r=await req.guild.roles.create({name:clampText(req.body.name,100),color:req.body.color||'#a855f7',mentionable:!!req.body.mentionable,reason:cfg.panelName}); audit(req,'create_role',{guildId:req.guild.id,roleId:r.id,name:r.name}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.delete('/api/roles/:guildId/:roleId', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try { const r=req.guild.roles.cache.get(req.params.roleId); if(!r)throw new Error('Role not found'); await r.delete(cfg.panelName); audit(req,'delete_role',{guildId:req.guild.id,roleId:r.id}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/emojis', requireAuth, requireCsrf, upload.single('image'), requireGuild, async (req,res) => {
    try { if(!req.file)throw new Error('Image required'); const e=await req.guild.emojis.create({attachment:req.file.buffer,name:clampText(req.body.name,32).replace(/[^a-zA-Z0-9_]/g,'_'),reason:cfg.panelName}); audit(req,'create_emoji',{guildId:req.guild.id,emojiId:e.id,name:e.name}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.delete('/api/emojis/:guildId/:emojiId', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try {
      const e=req.guild.emojis.cache.get(req.params.emojiId);
      if(!e)throw new Error('Emoji not found');
      const name=e.name;
      await e.delete(cfg.panelName);
      audit(req,'delete_emoji',{guildId:req.guild.id,emojiId:req.params.emojiId,name});
      res.json({ok:true});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.get('/api/members/:guildId', requireAuth, requireGuild, async (req,res) => {
    try { const ms=await req.guild.members.fetch({limit:100}); res.json({members:ms.map(m=>({id:m.id,username:m.user.username,displayName:m.displayName,avatar:m.displayAvatarURL({size:64}),bot:m.user.bot,roles:m.roles.cache.filter(r=>r.id!==req.guild.id).map(r=>({id:r.id,name:r.name}))}))}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/members/action', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try {
      const m=await req.guild.members.fetch(req.body.userId), reason=clampText(req.body.reason||cfg.panelName,512);
      if(req.body.action==='kick')await m.kick(reason);
      else if(req.body.action==='ban')await req.guild.members.ban(m.id,{reason});
      else if(req.body.action==='timeout')await m.timeout(Math.max(60000,Math.min(Number(req.body.durationMinutes||10)*60000,28*86400000)),reason);
      else if(req.body.action==='untimeout')await m.timeout(null,reason);
      else throw new Error('Unknown member action');
      audit(req,'member_action',{guildId:req.guild.id,userId:m.id,action:req.body.action}); res.json({ok:true});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/members/role', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try { const m=await req.guild.members.fetch(req.body.userId),r=req.guild.roles.cache.get(req.body.roleId); if(!r)throw new Error('Role not found'); if(req.body.mode==='remove')await m.roles.remove(r); else await m.roles.add(r); audit(req,'member_role',{guildId:req.guild.id,userId:m.id,roleId:r.id,mode:req.body.mode}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/presence', requireAuth, requireCsrf, (req,res) => {
    try { const types={playing:ActivityType.Playing,watching:ActivityType.Watching,listening:ActivityType.Listening,competing:ActivityType.Competing}; req.app.locals.discord.user.setPresence({status:req.body.status||'online',activities:[{name:clampText(req.body.text||cfg.botActivity,128),type:types[req.body.type]??ActivityType.Watching}]}); audit(req,'presence',{status:req.body.status,text:req.body.text}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.get('/api/audit', requireAuth, (req,res) => res.json({rows:readAudit().slice(0,200)}));
}
