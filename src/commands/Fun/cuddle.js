import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `Sending 100% pure cuddle energy to <@${t.id}>! ✨`,
  (u, t) => `*snuggles closely and cuddles with* <@${t.id}> 🧸💖`,
  (u, t) => `*pulls* <@${t.id}> *close for some cozy cuddles* (っ´ω\`)ﾉ`,
  (u, t) => `*cuddles up next to* <@${t.id}> *warmly* 🌸`
];

export default {
  data: new SlashCommandBuilder()
    .setName('cuddle')
    .setDescription('Cuddle up with someone special!')
    .addUserOption(opt => opt.setName('target').setDescription('Member to cuddle').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('target');

    if (target.id === interaction.user.id) {
      return interaction.editReply({ content: `*curls up with a blanket and cuddles self* 🛏️` });
    }

    try {
      const res = await fetch('https://nekos.best/api/v2/cuddle', {
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
      await interaction.editReply({ content: `*cuddles with* <@${target.id}> 💖` });
    }
  }
};
