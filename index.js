import 'dotenv/config';
import fs from 'fs';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { ALLOWED_USERS } from './config.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// load commands dynamically
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = await import(`./commands/${file}`);
  client.commands.set(cmd.default.data.name, cmd.default);
}

client.once('ready', () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unknown command', ephemeral: true });
    return;
  }

  // whitelist check
  if (!ALLOWED_USERS.includes(interaction.user.id)) {
    await interaction.reply({ content: '❌ You are not authorized to use this bot.', ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Error executing command.', ephemeral: true });
    } else {
      await interaction.followUp({ content: '❌ Error executing command.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
