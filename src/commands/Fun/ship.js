import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calculates the love compatibility percentage between two users!')
    .addUserOption(opt => opt.setName('user1').setDescription('First person').setRequired(true))
    .addUserOption(opt => opt.setName('user2').setDescription('Second person (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2') || interaction.user;

    // Generates a consistent daily score between the same two people
    const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const combined = BigInt(user1.id) + BigInt(user2.id) + BigInt(daySeed);
    const score = Number(combined % 101n);

    // Visual heart progress bar (10 segments)
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    const progressBar = '❤️'.repeat(filled) + '🖤'.repeat(empty);

    let verdict = 'Soulmates made in heaven! 💍✨';
    if (score < 20) verdict = 'Total strangers... not a chance! 💀';
    else if (score < 45) verdict = 'Strictly stuck in the friendzone! 🤝';
    else if (score < 70) verdict = 'There is definitely a strong spark here! ✨';
    else if (score < 90) verdict = 'A very cute match! Take them on a date! 🌸';

    const embed = new EmbedBuilder()
      .setColor('#ff4081')
      .setTitle('💘 Love Compatibility Meter 💘')
      .setDescription(
        `**Ship:** <@${user1.id}> × <@${user2.id}>\n\n` +
        `**Score:** \`${score}%\`\n` +
        `[ ${progressBar} ]\n\n` +
        `*${verdict}*`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
