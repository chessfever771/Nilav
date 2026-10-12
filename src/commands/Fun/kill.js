import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*completely annihilates* <@${t.id}>! 💀💥`,
  (u, t) => `<@${t.id}> was eliminated in cold blood by <@${u.id}>! ⚰️`,
  (u, t) => `*lands a fatal blow on* <@${t.id}>! WASTED. 🩸`,
  (u, t) => `Rest in peace <@${t.id}>... you had a good run! 🪦`
];

export default {
  data: new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Dramatically eliminate another member!')
    .addUserOption(opt => opt.setName('target').setDescription('Member to eliminate').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('target');

    if (target.id === interaction.user.id) {
      return interaction.editReply({ content: `You can't eliminate yourself! Stay alive! 🛡️` });
    }

    try {
      // nekos.best doesn't have "kill", but "shoot" and "yeet" match the vibe
      const endpoint = Math.random() > 0.5 ? 'shoot' : 'yeet';
      const res = await fetch(`https://nekos.best/api/v2/${endpoint}`, {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data.results[0]?.url;
      const line = phrases[Math.floor(Math.random() * phrases.length)](interaction.user, target);

      const embed = new EmbedBuilder()
        .setColor('#e74c3c') // Crimson red accent
        .setDescription(line)
        .setImage(gifUrl);

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: `*eliminated* <@${target.id}>! 💀` });
    }
  }
};
