# Discord Distro Finder Bot (Node.js / discord.js v14)

WARNING: Do NOT commit or share your `.env` file with real tokens. If you previously leaked tokens, rotate them immediately.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Fill in `.env` with your secrets:
   ```
   DISCORD_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_discord_app_id
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   ```
3. Deploy slash commands (one-time / after edits):
   ```bash
   npm run deploy
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Commands
- `/distro artist url:<spotify_artist_url>` — lists labels/copyrights across an artist's catalog
- `/distro release url:<spotify_album_or_track_url>` — shows label, release date, UPC, ISRCs, and basic credits available via Spotify API

Only whitelisted user IDs can use the commands (see `config.js`).
