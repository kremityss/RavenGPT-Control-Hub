import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { ActivityType } from 'discord.js';
import { assertConfig, cfg, client } from './src/core.js';
import { mountCoreRoutes } from './src/routes-core.js';
import { mountMessagingRoutes } from './src/routes-messaging.js';
import { mountAdminRoutes } from './src/routes-admin.js';

assertConfig();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const upload=multer({storage:multer.memoryStorage(),limits:{files:10,fileSize:cfg.maxUploadMb*1024*1024}});

app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'https:','data:'],connectSrc:["'self'"]}}}));
app.use(express.json({limit:'2mb'}));
app.use(express.urlencoded({extended:true}));
app.use(session({name:'ravengpt.sid',secret:cfg.sessionSecret,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:cfg.prod,maxAge:12*60*60*1000}}));
app.use('/api',rateLimit({windowMs:60_000,limit:150,standardHeaders:'draft-8',legacyHeaders:false}));
app.locals.discord=client;
app.get('/health',(req,res)=>res.json({ok:true,botReady:client.isReady(),uptime:Math.round(process.uptime())}));

mountCoreRoutes(app);
mountMessagingRoutes(app,upload);
mountAdminRoutes(app,upload);
app.use(express.static(path.join(__dirname,'public')));
app.use((e,req,res,next)=>{if(e instanceof multer.MulterError)return res.status(400).json({error:e.message});console.error(e);res.status(500).json({error:e.message||'Internal server error'});});

client.once('ready',()=>{console.log(`RavenGPT connected as ${client.user.tag}`);client.user.setPresence({status:'online',activities:[{name:cfg.botActivity,type:ActivityType.Watching}]});});
client.on('error',e=>console.error('Discord:',e));
await client.login(cfg.token);
app.listen(cfg.port,()=>console.log(`RavenGPT Control Hub listening on ${cfg.port}`));
