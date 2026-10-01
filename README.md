# RavenGPT Control Hub V1

A professional web dashboard for the RavenGPT Discord bot/application.

## Security first

The bot token previously pasted into chat should be considered exposed.

1. Open Discord Developer Portal.
2. Open your RavenGPT application.
3. Go to **Bot**.
4. Regenerate/reset the token.
5. Put the NEW token only in the local `.env` file.
6. Do not commit `.env` to GitHub.

The Application ID and public key are already included in `.env.example`:

- Application ID: `1555059247425912984`
- Public key: `d815d61cb80eeaadd0c6874206f7b047ea43d04365605f9e14b731dc0fc32813`

The public key is not a bot credential.

## What the dashboard can do

- Discord OAuth login
- Only shows shared servers where the signed-in user has **Manage Server** or **Administrator**
- Server overview and live bot ping
- Send messages and links
- Rich Embed Studio
- Upload photos, videos, documents, ZIPs, and other files
- Add reactions
- View/create/delete custom emojis
- Create/delete channels and categories
- Create/delete roles
- View members
- Add/remove roles from members
- Timeout, kick, and ban controls
- Change bot status/activity
- View and delete recent messages
- Edit messages authored by the bot
- Audit log for dashboard actions
- CSRF protection
- HTTP rate limiting
- Secure server-side bot token
- Destructive-action confirmation UI
- Mobile/desktop responsive RavenGPT interface

Actual Discord actions still require the bot's role to have the matching Discord permissions.

## Discord Developer Portal setup

### OAuth2 Redirect

Add this redirect URL while testing locally:

`http://localhost:3000/auth/callback`

For a hosted deployment, replace it with your HTTPS domain, for example:

`https://panel.example.com/auth/callback`

Then update `REDIRECT_URI` in `.env`.

### Bot intents

Under **Bot > Privileged Gateway Intents**, enable:

- Server Members Intent
- Message Content Intent

The dashboard does not expose the bot token to the browser.

## Installation

Requires Node.js 20+.

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
DISCORD_TOKEN=YOUR_NEW_REGENERATED_TOKEN
CLIENT_SECRET=YOUR_DISCORD_OAUTH_CLIENT_SECRET
SESSION_SECRET=A_LONG_RANDOM_SECRET
```

Do not paste those secrets into public chats.

Then:

```bash
npm install
npm start
```

Open:

`http://localhost:3000`

## Production

Use HTTPS and set:

```env
NODE_ENV=production
REDIRECT_URI=https://your-domain.com/auth/callback
```

For a public deployment, use a persistent production session store instead of the default in-memory Express session store.

## Files

- `server.js` — Discord bot, OAuth, API, security, audit
- `public/index.html` — dashboard shell
- `public/styles.css` — RavenGPT UI
- `public/app.js` — tabs and controls
- `.env.example` — configuration template
