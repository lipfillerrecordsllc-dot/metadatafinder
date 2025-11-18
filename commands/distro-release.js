import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { spotifyGet } from '../spotify.js';

export default {
  data: new SlashCommandBuilder()
    .setName('distro')
    .setDescription('Distro lookup commands')
    .addSubcommand(sub =>
      sub.setName('release')
        .setDescription('Get distributor info for a release')
        .addStringOption(opt => opt.setName('url').setDescription('Spotify album or track URL').setRequired(true))
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url').trim();
    // detect album or track id
    let id = null;
    let type = null;
    if (url.includes('/album/')) {
      id = url.split('/album/')[1].split('?')[0];
      type = 'album';
    } else if (url.includes('/track/')) {
      id = url.split('/track/')[1].split('?')[0];
      type = 'track';
    } else {
      return interaction.reply({ content: 'Invalid album or track URL.', ephemeral: true });
    }

    await interaction.reply({ content: '🔎 Fetching release info...' });

    let albumData;
    if (type === 'album') {
      albumData = await spotifyGet(`albums/${id}`);
    } else {
      // track -> get track then its album
      const track = await spotifyGet(`tracks/${id}`);
      albumData = await spotifyGet(`albums/${track.album.id}`);
    }

    const embed = new EmbedBuilder()
      .setTitle(albumData.name)
      .setURL(`https://open.spotify.com/album/${albumData.id}`)
      .setColor(0x1DB954)
      .addFields(
        { name: 'Label', value: albumData.label ?? 'N/A', inline: true },
        { name: 'Release Date', value: albumData.release_date ?? 'N/A', inline: true },
        { name: 'Total Tracks', value: String(albumData.total_tracks ?? 'N/A'), inline: true }
      );

    // UPC
    const upc = albumData.external_ids?.upc ?? 'N/A';
    embed.addFields({ name: 'UPC', value: upc, inline: true });

    // ISRCs and basic credits (artists per track)
    try {
      const tracks = await spotifyGet(`albums/${albumData.id}/tracks?limit=50`);
      let isrcText = '';
      let creditsText = '';
      for (const t of tracks.items) {
        const isrc = t.external_ids?.isrc ?? 'N/A';
        isrcText += `${t.track_number}. ${t.name} — ISRC: ${isrc}\n`;
        const artists = t.artists.map(a => a.name).join(', ');
        creditsText += `${t.track_number}. ${artists}\n`;
      }
      if (isrcText) embed.addFields({ name: 'ISRCs (per track)', value: isrcText.slice(0,1024) });
      if (creditsText) embed.addFields({ name: 'Artists (per track)', value: creditsText.slice(0,1024) });
    } catch (e) {
      console.warn('tracks fetch failed', e.message);
    }

    // Copyrights / distributor-ish metadata
    if (albumData.copyrights?.length) {
      embed.addFields({ name: 'Copyrights', value: albumData.copyrights.map(c=>c.text).join('\n').slice(0,1024) });
    }

    return interaction.editReply({ content: null, embeds: [embed] });
  }
};
