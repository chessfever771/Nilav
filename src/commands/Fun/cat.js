import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const catPhrases = [
  'Here is your daily dose of feline goodness! 🐾',
  'A wild cat appeared! 🐱',
  'Pawsitively adorable! ✨',
  'Look at this little guy! 💖',
  'Pure cat energy for your feed! ฅ^•ﻌ•^ฅ'
];

export default {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Sends a random cute cat picture or GIF!')
    .addBooleanOption(option =>
      option
        .setName('gif')
        .setDescription('Set to True to get an animated cat GIF instead of a photo')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const wantGif = interaction.options.getBoolean('gif') || false;
    const endpoint = wantGif
      ? 'https://api.thecatapi.com/v1/images/search?mime_types=gif'
      : 'https://api.thecatapi.com/v1/images/search';

    try {
      const res = await fetch(endpoint, {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const catUrl = data[0]?.url;

      if (!catUrl) {
        return interaction.editReply({ content: '😿 Could not find a kitty right now. Try again!' });
      }

      const randomPhrase = catPhrases[Math.floor(Math.random() * catPhrases.length)];

      const embed = new EmbedBuilder()
        .setColor('#ff9f43') // Warm orange aesthetic
        .setDescription(`**${randomPhrase}**`)
        .setImage(catUrl)
        .setFooter({ text: 'TheCatAPI • ฅ(＾・ω・＾ฅ)' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Error fetching cat image:', err);
      await interaction.editReply({
        content: '😿 Failed to connect to the cat archive. Please try again in a moment!'
      });
    }
  }
};
