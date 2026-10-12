import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*plants a soft kiss on* <@${t.id}>*'s cheek!* 💋✨`,
  (u, t) => `*leans in and gives* <@${t.id}> *a sweet, gentle kiss* 🌸💖`,
  (u, t) => `*steals a quick kiss from* <@${t.id}>! (⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄`,
  (u, t) => `Sending sweet kisses to <@${t.id}>! 💋`
];

export default {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Give someone a sweet kiss!')
    .addUserOption(opt => opt.setName('target').setDescription('Member to kiss').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('target');

    if (target.id === interaction.user.id) {
      return interaction.editReply({ content: `*blows a kiss in the mirror* ( ˘ ³˘)♥` });
    }

    try {
      const res = await fetch('https://nekos.best/api/v2/kiss', {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data.results[0]?.url;
      const line = phrases[Math.floor(Math.random() * phrases.length)](interaction.user, target);

      const embed = new EmbedBuilder()
        .setColor('#ff4081')
        .setDescription(line)
        .setImage(gifUrl);

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: `*kisses* <@${target.id}>! 💋` });
    }
  }
};
