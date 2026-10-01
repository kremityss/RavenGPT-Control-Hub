import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export const cfg = {
  token: process.env.DISCORD_TOKEN?.trim() || '',
  clientId: process.env.CLIENT_ID?.trim() || '',
  clientSecret: process.env.CLIENT_SECRET?.trim() || '',
  redirectUri: process.env.REDIRECT_URI?.trim() || '',
  sessionSecret: process.env.SESSION_SECRET?.trim() || '',
  port: Number(process.env.PORT || 3000),
  prod: process.env.NODE_ENV === 'production',
  maxUploadMb: Math.max(1, Number(process.env.MAX_UPLOAD_MB || 24)),
  panelName: process.env.PANEL_NAME || 'RavenGPT Control Hub',
  botActivity: process.env.BOT_ACTIVITY || 'RavenGPT Control Hub',
};

export function assertConfig() {
  const missing = [
    ['DISCORD_TOKEN', cfg.token], ['CLIENT_ID', cfg.clientId],
    ['CLIENT_SECRET', cfg.clientSecret], ['REDIRECT_URI', cfg.redirectUri],
    ['SESSION_SECRET', cfg.sessionSecret],
  ].filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

export const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildEmojisAndStickers,
]});

const auditFile = path.join(rootDir, 'data', 'audit.json');
export const clampText = (v, max=2000) => String(v ?? '').slice(0, max);

export function readAudit() {
  try { return JSON.parse(fs.readFileSync(auditFile, 'utf8')); }
  catch { return []; }
}

export function audit(req, action, details={}) {
  const rows = readAudit();
  rows.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    userId: req.session.user?.id,
    username: req.session.user?.username,
    action,
    ...details,
  });
  fs.mkdirSync(path.dirname(auditFile), { recursive: true });
  fs.writeFileSync(auditFile, JSON.stringify(rows.slice(0, 500), null, 2));
}

export async function discordApi(endpoint, accessToken) {
  const r = await fetch(`https://discord.com/api/v10${endpoint}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`Discord API ${r.status}`);
  return r.json();
}

function adminPermission(bits) {
  try {
    const p = BigInt(bits || '0');
    const admin = BigInt(PermissionFlagsBits.Administrator);
    const manage = BigInt(PermissionFlagsBits.ManageGuild);
    return (p & admin) === admin || (p & manage) === manage;
  } catch { return false; }
}

export async function allowedGuildIds(req) {
  const rows = await discordApi('/users/@me/guilds', req.session.accessToken);
  return new Set(rows
    .filter(g => adminPermission(g.permissions))
    .filter(g => client.guilds.cache.has(g.id))
    .map(g => g.id));
}

export function requireAuth(req,res,next) {
  if (!req.session.user || !req.session.accessToken) return res.status(401).json({ error:'Unauthorized' });
  next();
}

export function requireCsrf(req,res,next) {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  if (!req.session.csrf || req.get('x-csrf-token') !== req.session.csrf) return res.status(403).json({ error:'Invalid CSRF token' });
  next();
}

export async function requireGuild(req,res,next) {
  try {
    const guildId = req.params.guildId || req.body.guildId || req.query.guildId;
    if (!guildId) return res.status(400).json({ error:'guildId required' });
    if (!(await allowedGuildIds(req)).has(guildId)) return res.status(403).json({ error:'Manage Server permission required' });
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error:'Bot is not in that server' });
    req.guild = guild;
    next();
  } catch (e) { next(e); }
}

export function textChannel(guild, id) {
  const c = guild.channels.cache.get(id);
  if (!c?.isTextBased()) throw new Error('Text channel not found');
  return c;
}
