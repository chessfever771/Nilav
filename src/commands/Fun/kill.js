import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*completely annihilates* <@${t.id}>! 💀💥`,
  (u, t) => `<@${t.id}> was eliminated in cold blood by <@${u.id}>! ⚰️`,
  (u, t) => `*lands a fatal blow on* <@${t.id}>! WASTED. 🩸`,
  (u, t) => `Rest in peace <@${t.id}>... you had a good run! 🪦`
];

async function resolveMember(message, query) {
  if (!message.guild) return null;

  // 1. Direct @mention
  if (message.mentions?.members?.size > 0) {
    return message.mentions.members.first();
  }
  if (message.mentions?.users?.size > 0) {
    const user = message.mentions.users.first();
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    return member || user;
  }

  const cleanQuery = (typeof query === 'string' ? query : '').trim();
  if (!cleanQuery) return null;

  // 2. ID Lookup
  const cleanId = cleanQuery.replace(/[<@!>]/g, '');
  if (/^\d{17,20}$/.test(cleanId)) {
    const byId = await message.guild.members.fetch(cleanId).catch(() => null);
    if (byId) return byId;
    const userById = await message.client.users.fetch(cleanId).catch(() => null);
    if (userById) return userById;
  }

  // 3. Cache lookup
  const search = cleanQuery.toLowerCase();
  let found = message.guild.members.cache.find(m =>
    m.user?.username?.toLowerCase() === search ||
    m.user?.globalName?.toLowerCase() === search ||
    m.displayName?.toLowerCase() === search ||
    (m.nickname && m.nickname.toLowerCase() === search)
  );
  if (found) return found;

  // 4. REST search (uncached/offline members)
  try {
    const searchResults = await message.guild.members.search({ query: cleanQuery, limit: 5 });
    if (searchResults && searchResults.size > 0) {
      const exact = searchResults.find(m =>
        m.user?.username?.toLowerCase() === search ||
        m.user?.globalName?.toLowerCase() === search ||
        m.displayName?.toLowerCase() === search ||
        (m.nickname && m.nickname.toLowerCase() === search)
      );
      return exact || searchResults.first();
    }
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

    let targetMember = null;
    let targetQuery = '';

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
      // 1. Direct mention priority
      if (context.mentions?.members?.size > 0) {
        targetMember = context.mentions.members.first();
      } else if (context.mentions?.users?.size > 0) {
        const user = context.mentions.users.first();
        targetMember = await context.guild?.members.fetch(user.id).catch(() => null) || user;
      }

      // 2. Query extraction if no direct mention
      if (!targetMember) {
        if (Array.isArray(args) && args.length > 0) {
          targetQuery = args.join(' ').trim();
        } else if (typeof args === 'string' && args.trim()) {
          targetQuery = args.trim();
        } else if (context.content) {
          const raw = context.content.trim();
          const words = raw.split(/\s+/);
          targetQuery = words.length > 1 ? words.slice(1).join(' ').trim() : raw;
        }

        if (targetQuery) {
          targetMember = await resolveMember(context, targetQuery);
        }
      }

      // 3. Validation replies
      if (!targetMember) {
        if (!targetQuery) {
          return context.reply('⚠️ Please specify who to eliminate! (e.g. `mmkill @user` or `mmkill username`)');
        }
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
