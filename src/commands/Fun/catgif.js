import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('billa')
    .setDescription('Generates a custom animated cat GIF with your text!')
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('The caption to put on the cat GIF (optional)')
        .setRequired(false)
        .setMaxLength(60)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const text = interaction.options.getString('text');

    // Build the dynamic CATAAS URL
    // Adding a timestamp cache-buster (?t=...) ensures a fresh random cat every time
    const timestamp = Date.now();
    let gifUrl;

    if (text) {
      const cleanText = encodeURIComponent(text.trim());
      gifUrl = `https://cataas.com/cat/gif/says/${cleanText}?fontSize=45&fontColor=white&t=${timestamp}`;
    } else {
      gifUrl = `https://cataas.com/cat/gif?t=${timestamp}`;
    }

    const embed = new EmbedBuilder()
      .setColor('#ff9f43')
      .setDescription(text ? `🐱 **"${text}"**` : '🐱 **Random Cat GIF**')
      .setImage(gifUrl)
      .setFooter({ text: 'Powered by CATAAS' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
