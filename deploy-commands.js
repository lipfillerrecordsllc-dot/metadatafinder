import 'dotenv/config';
import fs from 'fs';
import { REST, Routes } from 'discord.js';

const commands = [];
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of files) {
  const cmd = await import(`./commands/${file}`);
  commands.push(cmd.default.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log('Commands registered.');
  } catch (err) {
    console.error(err);
  }
})();
