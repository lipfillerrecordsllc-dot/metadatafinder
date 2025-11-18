import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { spotifyGet } from '../spotify.js';

export default {
  data: new SlashCommandBuilder()
    .setName('distro')
    .setDescription('Distro lookup commands')
    .addSubcommand(sub =>
      sub.setName('artist')
        .setDescription('Analyze all distributors for an artist')
        .addStringOption(opt => opt.setName('url').setDescription('Spotify artist URL').setRequired(true))
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url').trim();
    const idMatch = url.match(/artist\/([A-Za-z0-9]+)/);
    if (!idMatch) return interaction.reply({ content: 'Invalid artist URL.', ephemeral: true });
    const artistId = idMatch[1];

    await interaction.reply({ content: '🔍 Fetching artist catalog (may take a moment)...' });

    // fetch all albums (paginated)
    let albums = [];
    let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single,appears_on&market=US`;

    while (nextUrl) {
      const data = await spotifyGet(nextUrl);
      albums.push(...data.items);
      nextUrl = data.next;
    }

    // dedupe albums by id
    const unique = new Map();
    for (const a of albums) unique.set(a.id, a);
    albums = Array.from(unique.values());

    const labelCounts = new Map();
    const copyrightSet = new Set();

    for (const album of albums) {
      try {
        const meta = await spotifyGet(`albums/${album.id}`);
        if (meta.label) labelCounts.set(meta.label, (labelCounts.get(meta.label) || 0) + 1);
        if (meta.copyrights) meta.copyrights.forEach(c => copyrightSet.add(c.text));
      } catch (e) {
        console.warn('Failed album fetch', album.id, e.message);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('Distributor / Label summary')
      .setDescription(`Artist: ${artistId} — scanned ${albums.length} releases`)
      .setColor(0x1DB954);

    if (labelCounts.size) {
      let text = '';
      for (const [label, count] of labelCounts) {
        text += `**${label}** — ${count} releases\n`;
      }
      embed.addFields({ name: 'Labels (by release count)', value: text.slice(0, 1024) });
    } else {
      embed.addFields({ name: 'Labels', value: 'No label data found' });
    }

    if (copyrightSet.size) {
      embed.addFields({ name: 'Copyright / Distributor metadata', value: Array.from(copyrightSet).slice(0,5).join('\n') });
    }

    return interaction.editReply({ content: null, embeds: [embed] });
  }
};
