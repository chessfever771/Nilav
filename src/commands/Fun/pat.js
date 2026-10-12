import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// Random phrases matching the aesthetic
const patPhrases = [
  (target) => `*gives* <@${target.id}> *soft headpats* ✨`,
  (target) => `Sending 100% pure headpat energy to <@${target.id}>! ✨`,
  (target) => `*gently pats* <@${target.id}>*'s head! Good job~* 🌸`,
  (target) => `*comforts* <@${target.id}> *with warm, cozy headpats* 💖`,
  (target) => `*softly pats* <@${target.id}> *on the head* ( ´ ▽ \` )ﾉ`
];

export default {
  data: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Give someone a gentle headpat!')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The member you want to pat')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('target');

    // Prevent self-patting if you prefer, or give a cute self-pat response
    if (target.id === interaction.user.id) {
      return interaction.editReply({
        content: `*pats your own head gently* (っ´ω\`)ﾉ You're doing great!`,
      });
    }

    try {
      // Fetch a random pat GIF from nekos.best
      const res = await fetch('https://nekos.best/api/v2/pat', {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data.results[0]?.url;

      // Pick a random line from the phrases list
      const randomLine = patPhrases[Math.floor(Math.random() * patPhrases.length)](target);

      // Embed styled to match the screenshot
      const embed = new EmbedBuilder()
        .setColor('#ff4081') // Hot-pink accent bar on the left
        .setDescription(randomLine)
        .setImage(gifUrl);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      // Fallback in case of temporary network hiccups
      const fallbackEmbed = new EmbedBuilder()
        .setColor('#ff4081')
        .setDescription(`*gives* <@${target.id}> *soft headpats* ✨`)
        .setImage('https://media.tenor.com/E6fWvsGcwvgAAAAC/anime-pat.gif');

      await interaction.editReply({ embeds: [fallbackEmbed] });
    }
  }
};
