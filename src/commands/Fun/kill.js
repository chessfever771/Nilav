import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*completely annihilates* <@${t.id}>! 💀💥`,
  (u, t) => `<@${t.id}> was eliminated in cold blood by <@${u.id}>! ⚰️`,
  (u, t) => `*lands a fatal blow on* <@${t.id}>! WASTED. 🩸`,
  (u, t) => `Rest in peace <@${t.id}>... you had a good run! 🪦`
];

// Resolves mention, snowflake ID, or server username/nickname
async function resolveMember(message, query) {
  if (!query && (!message.mentions || message.mentions.members.size === 0)) return null;

  // 1. Direct @mention
  if (message.mentions?.members?.size > 0) {
    return message.mentions.members.first();
  }

  // 2. Discord User ID (17-20 digits)
  const cleanId = query.replace(/[<@!>]/g, '');
  if (/^\d{17,20}$/.test(cleanId)) {
    const byId = await message.guild.members.fetch(cleanId).catch(() => null);
    if (byId) return byId;
  }

  // 3. Username or Server Nickname (case-insensitive)
  const search = query.toLowerCase();
  let found = message.guild.members.cache.find(m =>
    m.user.username.toLowerCase() === search ||
    (m.nickname && m.nickname.toLowerCase() === search) ||
    (m.displayName && m.displayName.toLowerCase() === search)
  );

  // Fallback: search guild via API fetch if not cached
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
    .setName('kill')
    .setDescription('Dramatically eliminate another member!')
    .addUserOption(opt => opt.setName('target').setDescription('Member to eliminate').setRequired(true)),

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
      // Prefix execution (mmkill <target>)
      const targetQuery = Array.isArray(args) ? args[0] : (args || '').trim();

      if (!targetQuery && (!context.mentions || context.mentions.members.size === 0)) {
        return context.reply('⚠️ Please specify who to eliminate! (e.g. `mmkill @user`)');
      }

      targetMember = await resolveMember(context, targetQuery);

      // Halt immediately if no matching member exists
      if (!targetMember) {
        return context.reply(`❌ Could not find any member matching **"${targetQuery}"** in this server.`);
      }
    }

    // Prevent self-elimination
    if (targetMember.id === author.id) {
      const msg = "You can't eliminate yourself! Stay alive! 🛡️";
      return isInteraction ? context.editReply(msg) : context.reply(msg);
    }

    try {
      const endpoint = Math.random() > 0.5 ? 'shoot' : 'yeet';
      const res = await fetch(`https://nekos.best/api/v2/${endpoint}`, {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data.results[0]?.url;

      const line = phrases[Math.floor(Math.random() * phrases.length)](author, targetMember.user);

      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setDescription(line)
        .setImage(gifUrl);

      if (isInteraction) {
        await context.editReply({ embeds: [embed] });
      } else {
        await context.channel.send({ embeds: [embed] });
      }
    } catch {
      const fallback = `*eliminated* <@${targetMember.id}>! 💀`;
      if (isInteraction) await context.editReply(fallback);
      else await context.channel.send(fallback);
    }
  }
};
