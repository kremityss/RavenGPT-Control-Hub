import crypto from 'node:crypto';
import { PermissionsBitField, PermissionFlagsBits } from 'discord.js';
import { cfg, client, audit, discordApi, allowedGuildIds, requireAuth, requireCsrf, requireGuild } from './core.js';

export function mountCoreRoutes(app) {
  app.get('/auth/login', (req,res) => {
    const state = crypto.randomBytes(24).toString('hex');
    req.session.oauthState = state;
    const q = new URLSearchParams({
      client_id: cfg.clientId,
      response_type: 'code',
      redirect_uri: cfg.redirectUri,
      scope: 'identify guilds',
      state,
    });
    res.redirect(`https://discord.com/oauth2/authorize?${q}`);
  });

  app.get('/auth/callback', async (req,res) => {
    try {
      if (!req.query.code || req.query.state !== req.session.oauthState) return res.status(400).send('Invalid OAuth state');
      delete req.session.oauthState;
      const body = new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: 'authorization_code',
        code: String(req.query.code),
        redirect_uri: cfg.redirectUri,
      });
      const tr = await fetch('https://discord.com/api/v10/oauth2/token', {
        method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body,
      });
      if (!tr.ok) throw new Error('OAuth exchange failed');
      const tok = await tr.json();
      const u = await discordApi('/users/@me', tok.access_token);
      req.session.user = {
        id:u.id, username:u.username, globalName:u.global_name,
        avatar:u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : null,
      };
      req.session.accessToken = tok.access_token;
      req.session.csrf = crypto.randomBytes(24).toString('hex');
      audit(req, 'login');
      res.redirect('/');
    } catch (e) {
      console.error(e);
      res.status(500).send('Discord sign-in failed');
    }
  });

  app.post('/auth/logout', requireAuth, requireCsrf, (req,res) => {
    audit(req,'logout');
    req.session.destroy(() => res.json({ok:true}));
  });

  app.get('/api/me', requireAuth, (req,res) => res.json({
    user:req.session.user, csrf:req.session.csrf,
    bot:{ ready:client.isReady(), id:client.user?.id, username:client.user?.username || 'Connecting', avatar:client.user?.displayAvatarURL({size:128}) || null, ping:client.ws.ping },
  }));

  app.get('/api/overview', requireAuth, async (req,res,next) => {
    try {
      const ids = await allowedGuildIds(req);
      const guilds = client.guilds.cache.filter(g => ids.has(g.id)).map(g => ({
        id:g.id,name:g.name,icon:g.iconURL({size:128}),members:g.memberCount,
        channels:g.channels.cache.size,roles:g.roles.cache.size,emojis:g.emojis.cache.size,
      }));
      res.json({ guilds, totals:{
        guilds:guilds.length,
        members:guilds.reduce((a,g)=>a+g.members,0),
        channels:guilds.reduce((a,g)=>a+g.channels,0),
        ping:client.ws.ping,
      }});
    } catch(e) { next(e); }
  });

  app.get('/api/invite', requireAuth, (req,res) => {
    const p = new PermissionsBitField([
      PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions,
      PermissionFlagsBits.UseExternalEmojis, PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles,
      PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageGuildExpressions,
    ]);
    const q = new URLSearchParams({ client_id:cfg.clientId, scope:'bot applications.commands', permissions:p.bitfield.toString() });
    res.json({url:`https://discord.com/oauth2/authorize?${q}`});
  });

  app.get('/api/guilds/:guildId', requireAuth, requireGuild, async (req,res) => {
    const g = req.guild;
    await Promise.all([g.channels.fetch(), g.roles.fetch(), g.emojis.fetch().catch(()=>null)]);
    res.json({
      guild:{id:g.id,name:g.name,icon:g.iconURL({size:128}),memberCount:g.memberCount},
      channels:g.channels.cache.map(c=>({id:c.id,name:c.name,type:c.type,textBased:c.isTextBased(),parentId:c.parentId,position:c.position})).sort((a,b)=>a.position-b.position),
      roles:g.roles.cache.filter(r=>!r.managed&&r.id!==g.id).map(r=>({id:r.id,name:r.name,color:r.hexColor,position:r.position})).sort((a,b)=>b.position-a.position),
      emojis:g.emojis.cache.map(e=>({id:e.id,name:e.name,url:e.imageURL(),text:e.toString()})),
    });
  });
}
