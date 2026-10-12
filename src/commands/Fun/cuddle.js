import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `Sending 100% pure cuddle energy to <@${t.id}>! ✨`,
  (u, t) => `*snuggles closely and cuddles with* <@${t.id}> 🧸💖`,
  (u, t) => `*pulls* <@${t.id}> *close for some cozy cuddles* (っ´ω\`)ﾉ`,
  (u, t) => `*cuddles up next to* <@${t.id}> *warmly* 🌸`
];

async function resolveMember(message, query) {
  if (!query && (!message.mentions || message.mentions.members.size === 0)) return null;

  if (message.mentions?.members?.size > 0) {
    return message.mentions.members.first();
  }

  const cleanId = query.replace(/[<@!>]/g, '');
  if (/^\d{17,20}$/.test(cleanId)) {
    const byId = await message.guild.members.fetch(cleanId).catch(() => null);
    if (byId) return byId;
  }

  const search = query.toLowerCase();
  let found = message.guild.members.cache.find(m =>
    m.user.username.toLowerCase() === search ||
    (m.nickname && m.nickname.toLowerCase() === search) ||
    (m.displayName && m.displayName.toLowerCase() === search)
  );

  if (!found) {
    try {
      const fetched = await message.guild.members.fetch({ query, limit: 1 });
      found = fetched.first();
    } catch {}
  }

  return found || null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('cuddle')
    .setDescription('Cuddle up with someone special!')
    .addUserOption(opt => opt.setName('target').setDescription('Member to cuddle').setRequired(true)),

  async execute(context, args) {
    const isInteraction = Boolean(context.isChatInputCommand?.());
    const author = isInteraction ? context.user : context.author;

    let targetMember;

    if (isInteraction) {
      await context.deferReply();
      targetMember = context.options.getMember('target');
      if (!targetMember) {
        const user = context.options.getUser('target');
        if (user) targetMember = await context.guild.members.fetch(user.id).catch(() => null);
      }
    } else {
      const targetQuery = Array.isArray(args) ? args[0] : (args || '').trim();

      if (!targetQuery && (!context.mentions || context.mentions.members.size === 0)) {
        return context.reply('⚠️ Please specify who to cuddle! (e.g. `mmcuddle @user`)');
      }

      targetMember = await resolveMember(context, targetQuery);

      if (!targetMember) {
        return context.reply(`❌ Could not find any member matching **"${targetQuery}"** in this server.`);
      }
    }

    if (targetMember.id === author.id) {
      const selfMsg = `*curls up with a blanket and cuddles self* 🛏️🧸`;
      return isInteraction ? context.editReply(selfMsg) : context.reply(selfMsg);
    }

    try {
      const res = await fetch('https://nekos.best/api/v2/cuddle', {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data.results[0]?.url;

      const line = phrases[Math.floor(Math.random() * phrases.length)](author, targetMember.user);

      const embed = new EmbedBuilder()
        .setColor('#ff4081')
        .setDescription(line)
        .setImage(gifUrl);

      if (isInteraction) {
        await context.editReply({ embeds: [embed] });
      } else {
        await context.channel.send({ embeds: [embed] });
      }
    } catch {
      const fallback = `*cuddles warmly with* <@${targetMember.id}>! 💖`;
      if (isInteraction) await context.editReply(fallback);
      else await context.channel.send(fallback);
    }
  }
};
