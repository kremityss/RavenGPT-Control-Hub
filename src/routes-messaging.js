import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { audit, clampText, requireAuth, requireCsrf, requireGuild, textChannel } from './core.js';

export function mountMessagingRoutes(app, upload) {
  app.get('/api/messages/:guildId/:channelId', requireAuth, requireGuild, async (req,res) => {
    try {
      const c = textChannel(req.guild, req.params.channelId);
      const ms = await c.messages.fetch({limit:Math.min(50,Math.max(1,Number(req.query.limit||25)))});
      res.json({messages:ms.map(m=>({
        id:m.id,content:m.content,
        author:{id:m.author.id,username:m.author.username,bot:m.author.bot},
        createdAt:m.createdAt.toISOString(), embeds:m.embeds.length, url:m.url,
        attachments:[...m.attachments.values()].map(a=>({name:a.name,url:a.url,size:a.size})),
      }))});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/messages/send', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try {
      const m = await textChannel(req.guild, req.body.channelId).send({
        content:clampText(req.body.content),
        allowedMentions:req.body.allowMentions ? {parse:['users','roles']} : {parse:[]},
      });
      audit(req,'send_message',{guildId:req.guild.id,channelId:req.body.channelId,messageId:m.id});
      res.json({ok:true,url:m.url});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/messages/embed', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try {
      const b=req.body, e=new EmbedBuilder();
      if(b.title)e.setTitle(clampText(b.title,256));
      if(b.description)e.setDescription(clampText(b.description,4096));
      if(b.author)e.setAuthor({name:clampText(b.author,256)});
      if(b.footer)e.setFooter({text:clampText(b.footer,2048)});
      if(b.image)e.setImage(b.image); if(b.thumbnail)e.setThumbnail(b.thumbnail); if(b.url)e.setURL(b.url);
      if(b.color){const n=parseInt(String(b.color).replace('#',''),16);if(Number.isFinite(n))e.setColor(n);}
      const m=await textChannel(req.guild,b.channelId).send({content:clampText(b.content),embeds:[e],allowedMentions:{parse:[]}});
      audit(req,'send_embed',{guildId:req.guild.id,channelId:b.channelId,messageId:m.id});
      res.json({ok:true,url:m.url});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/messages/files', requireAuth, requireCsrf, upload.array('files',10), requireGuild, async (req,res) => {
    try {
      const files=(req.files||[]).map(f=>new AttachmentBuilder(f.buffer,{name:f.originalname}));
      const m=await textChannel(req.guild,req.body.channelId).send({content:clampText(req.body.content),files,allowedMentions:{parse:[]}});
      audit(req,'send_files',{guildId:req.guild.id,channelId:req.body.channelId,messageId:m.id,files:files.length});
      res.json({ok:true,url:m.url});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.patch('/api/messages/:guildId/:channelId/:messageId', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try {
      const m=await textChannel(req.guild,req.params.channelId).messages.fetch(req.params.messageId);
      if(m.author.id!==req.app.locals.discord.user.id)throw new Error('Bot can only edit its own messages');
      await m.edit({content:clampText(req.body.content),allowedMentions:{parse:[]}});
      audit(req,'edit_message',{guildId:req.guild.id,messageId:m.id}); res.json({ok:true});
    } catch(e) { res.status(400).json({error:e.message}); }
  });

  app.delete('/api/messages/:guildId/:channelId/:messageId', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try { const m=await textChannel(req.guild,req.params.channelId).messages.fetch(req.params.messageId); await m.delete(); audit(req,'delete_message',{guildId:req.guild.id,messageId:m.id}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });

  app.post('/api/messages/react', requireAuth, requireCsrf, requireGuild, async (req,res) => {
    try { const m=await textChannel(req.guild,req.body.channelId).messages.fetch(req.body.messageId); await m.react(req.body.emoji); audit(req,'reaction',{guildId:req.guild.id,messageId:m.id,emoji:req.body.emoji}); res.json({ok:true}); }
    catch(e) { res.status(400).json({error:e.message}); }
  });
}
