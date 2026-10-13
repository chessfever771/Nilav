import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*completely annihilates* <@${t.id}>! 💀💥`,
  (u, t) => `<@${t.id}> was eliminated in cold blood by <@${u.id}>! ⚰️`,
  (u, t) => `*lands a fatal blow on* <@${t.id}>! WASTED. 🩸`,
  (u, t) => `Rest in peace <@${t.id}>... you had a good run! 🪦`
];

async function resolveMember(message, query) {
  if (!message.guild) return null;

  // 1. Direct @mention (check members, then fallback to users)
  if (message.mentions?.members?.size > 0) {
    return message.mentions.members.first();
  }
  if (message.mentions?.users?.size > 0) {
    const mentionedUser = message.mentions.users.first();
    const fetched = await message.guild.members.fetch(mentionedUser.id).catch(() => null);
    if (fetched) return fetched;
  }

  const cleanQuery = (typeof query === 'string' ? query : '').trim();
  if (!cleanQuery) return null;

  // 2. Discord User ID or clean mention ID
  const cleanId = cleanQuery.replace(/[<@!>]/g, '');
  if (/^\d{17,20}$/.test(cleanId)) {
    const byId = await message.guild.members.fetch(cleanId).catch(() => null);
    if (byId) return byId;
  }

  const search = cleanQuery.toLowerCase();

  // 3. Search local cache first
  let found = message.guild.members.cache.find(m =>
    m.user?.username?.toLowerCase() === search ||
    m.user?.globalName?.toLowerCase() === search ||
    m.displayName?.toLowerCase() === search ||
    (m.nickname && m.nickname.toLowerCase() === search)
  );
  if (found) return found;

  // 4. REST search (works without privileged Gateway intents)
  try {
    const searchResults = await message.guild.members.search({ query: cleanQuery, limit: 5 });
    if (searchResults && searchResults.size > 0) {
      // Prioritize exact match if multiple returned
      const exact = searchResults.find(m =>
        m.user?.username?.toLowerCase() === search ||
        m.user?.globalName?.toLowerCase() === search ||
        m.displayName?.toLowerCase() === search ||
        (m.nickname && m.nickname.toLowerCase() === search)
      );
      return exact || searchResults.first();
    }
  } catch {}

  // 5. Gateway query fallback
  try {
    const fetched = await message.guild.members.fetch({ query: cleanQuery, limit: 1 });
    if (fetched?.size > 0) return fetched.first();
  } catch {}

  return null;
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
        if (user && context.guild) {
          targetMember = await context.guild.members.fetch(user.id).catch(() => null) || user;
        }
      }
    } else {
      // Robust query extraction for prefixes (array args, string args, or raw content)
      let targetQuery = '';
      if (Array.isArray(args) && args.length > 0) {
        targetQuery = args.join(' ').trim();
      } else if (typeof args === 'string' && args.trim()) {
        targetQuery = args.trim();
      } else if (context.content) {
        const words = context.content.trim().split(/\s+/);
        targetQuery = words.slice(1).join(' ').trim();
      }

      if (!targetQuery && (!context.mentions || (context.mentions.members?.size === 0 && context.mentions.users?.size === 0))) {
        return context.reply('⚠️ Please specify who to eliminate! (e.g. `_kill @user` or `_kill username`)');
      }

      targetMember = await resolveMember(context, targetQuery);

      if (!targetMember) {
        return context.reply(`❌ Could not find any member matching **"${targetQuery}"** in this server.`);
      }
    }

    const targetUser = targetMember.user || targetMember;

    if (targetUser.id === author.id) {
      const msg = "You can't eliminate yourself! Stay alive! 🛡️";
      return isInteraction ? context.editReply(msg) : context.reply(msg);
    }

    try {
      const endpoint = Math.random() > 0.5 ? 'shoot' : 'yeet';
      const res = await fetch(`https://nekos.best/api/v2/${endpoint}`, {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data?.results?.[0]?.url;

      const line = phrases[Math.floor(Math.random() * phrases.length)](author, targetUser);

      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setDescription(line);

      if (gifUrl) embed.setImage(gifUrl);

      if (isInteraction) {
        await context.editReply({ embeds: [embed] });
      } else {
        await context.channel.send({ embeds: [embed] });
      }
    } catch {
      const fallback = `*eliminated* <@${targetUser.id}>! 💀`;
      if (isInteraction) await context.editReply(fallback);
      else await context.channel.send(fallback);
    }
  }
};
