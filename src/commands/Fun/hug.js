import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*wraps arms tightly around* <@${t.id}> *giving a warm hug!* 🤗✨`,
  (u, t) => `*gives* <@${t.id}> *a huge, comforting bear hug!* 💖`,
  (u, t) => `Sending a giant dose of warm hugs to <@${t.id}>! ✨`,
  (u, t) => `*pulls* <@${t.id}> *into a soft, cozy embrace* (つ≧▽≦)つ`
];

export default {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Give someone a warm, tight hug!')
    .addUserOption(opt => opt.setName('target').setDescription('Member to hug').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('target');

    if (target.id === interaction.user.id) {
      return interaction.editReply({ content: `*hugs yourself tightly* (つ´∀｀)つ You deserve all the love!` });
    }

    try {
      const res = await fetch('https://nekos.best/api/v2/hug', {
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
      await interaction.editReply({ content: `*hugs* <@${target.id}> *warmly!* 🤗` });
    }
  }
};
