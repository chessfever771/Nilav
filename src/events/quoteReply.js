import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// Define the prefixes you want the bot to recognize
const PREFIXES = ['!', '?', '.']; 

export default {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bots and direct messages
    if (message.author.bot || !message.guild) return;

    // Check if the message matches <prefix>quote (e.g., !quote, ?quote, .quote)
    const content = message.content.trim().toLowerCase();
    const matchedPrefix = PREFIXES.find(p => content.startsWith(`${p}quote`));

    if (!matchedPrefix) return;

    // Verify the command is a reply to another message
    if (!message.reference || !message.reference.messageId) {
      const hint = await message.reply('Reply to a message and type `!quote` to quote it!');
      setTimeout(() => hint.delete().catch(() => {}), 5000);
      return;
    }

    try {
      // Fetch the original message that was replied to
      const targetMessage = await message.channel.messages.fetch(message.reference.messageId);

      if (!targetMessage) return;

      // Build the quote embed
      const quoteEmbed = new EmbedBuilder()
        .setColor(0x2f3136) // Sleek dark slate aesthetic
        .setAuthor({
          name: targetMessage.member?.displayName || targetMessage.author.username,
          iconURL: targetMessage.author.displayAvatarURL({ dynamic: true })
        })
        .setDescription(
          targetMessage.content.length > 0
            ? `> ${targetMessage.content.replace(/\n/g, '\n> ')}`
            : '*[No text content]*'
        )
        .setFooter({
          text: `Quoted by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp(targetMessage.createdAt);

      // If the quoted message had an attached image or GIF, include it
      const attachedImage = targetMessage.attachments.find(att =>
        att.contentType?.startsWith('image/')
      );
      if (attachedImage) {
        quoteEmbed.setImage(attachedImage.url);
      }

      // Add a jump button directly to the original message
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Jump to Message')
          .setStyle(ButtonStyle.Link)
          .setURL(targetMessage.url)
      );

      // Send the quote embed to the channel
      await message.channel.send({
        embeds: [quoteEmbed],
        components: [row]
      });

      // Delete the triggering '!quote' message to keep chat clean
      await message.delete().catch(() => {});

    } catch (error) {
      console.error('Error creating quote:', error);
    }
  }
};
