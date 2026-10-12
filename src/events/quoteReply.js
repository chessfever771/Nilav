import { AttachmentBuilder } from 'discord.js';
import { MiQ } from 'makeitaquote';

const PREFIXES = ['!', '?', '.'];

export default {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bots and direct messages
    if (message.author.bot || !message.guild) return;

    // Check for !quote, ?quote, or .quote
    const content = message.content.trim().toLowerCase();
    const isQuoteCmd = PREFIXES.some(prefix => content === `${prefix}quote`);

    if (!isQuoteCmd) return;

    // Ensure the command was sent as a reply
    if (!message.reference?.messageId) {
      const hint = await message.reply('Reply to a message with `!quote` to quote it!');
      setTimeout(() => hint.delete().catch(() => {}), 4000);
      return;
    }

    // Find the dedicated quotes channel
    const quotesChannel = message.guild.channels.cache.find(
      channel => channel.name.toLowerCase() === 'quotes' && channel.isTextBased()
    );

    if (!quotesChannel) {
      const errorMsg = await message.reply('Could not find a text channel named `#quotes`!');
      setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
      return;
    }

    try {
      // Fetch the message being quoted
      const targetMessage = await message.channel.messages.fetch(message.reference.messageId);

      if (!targetMessage || !targetMessage.content) {
        const errorMsg = await message.reply('Cannot quote an empty message or system message.');
        setTimeout(() => errorMsg.delete().catch(() => {}), 4000);
        return;
      }

      // Generate the image card
      const buffer = await new MiQ()
        .setFromMessage(targetMessage)
        .setWatermark(message.guild.name) // Adds your server name to the bottom-right corner
        .toBuffer('png');

      const attachment = new AttachmentBuilder(buffer, { name: 'quote.png' });

      // Send to the dedicated #quotes channel
      await quotesChannel.send({
        content: `*Quoted from* ${message.channel} *by* ${message.author}:`,
        files: [attachment]
      });

      // React to the user's command to confirm, then delete the triggering '!quote'
      await message.react('💬').catch(() => {});
      setTimeout(() => message.delete().catch(() => {}), 1500);

    } catch (error) {
      console.error('Failed to create quote card:', error);
    }
  }
};
