import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const phrases = [
  (u, t) => `*completely annihilates* <@${t.id}>! 💀💥`,
  (u, t) => `<@${t.id}> was eliminated in cold blood by <@${u.id}>! ⚰️`,
  (u, t) => `*lands a fatal blow on* <@${t.id}>! WASTED. 🩸`,
  (u, t) => `Rest in peace <@${t.id}>... you had a good run! 🪦`
];

async function resolveMember(context, query) {
  const msg = context.message || context;
  const guild = context.guild || msg.guild;
  if (!guild) return null;

  const mentions = msg.mentions || context.mentions;
  if (mentions?.members?.size > 0) {
    return mentions.members.first();
  }
  if (mentions?.users?.size > 0) {
    const user = mentions.users.first();
    const member = await guild.members.fetch(user.id).catch(() => null);
    return member || user;
  }

  const cleanQuery = (typeof query === 'string' ? query : '').trim();
  if (!cleanQuery) return null;

  const cleanId = cleanQuery.replace(/[<@!>]/g, '');
  if (/^\d{17,20}$/.test(cleanId)) {
    const byId = await guild.members.fetch(cleanId).catch(() => null);
    if (byId) return byId;
    const client = msg.client || context.client;
    if (client) {
      const userById = await client.users.fetch(cleanId).catch(() => null);
      if (userById) return userById;
    }
  }

  const search = cleanQuery.toLowerCase();
  let found = guild.members.cache.find(m =>
    m.user?.username?.toLowerCase() === search ||
    m.user?.globalName?.toLowerCase() === search ||
    m.displayName?.toLowerCase() === search ||
    (m.nickname && m.nickname.toLowerCase() === search)
  );
  if (found) return found;

  try {
    const searchResults = await guild.members.search({ query: cleanQuery, limit: 10 });
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

  try {
    const fetched = await guild.members.fetch({ query: cleanQuery, limit: 1 });
    if (fetched && fetched.size > 0) return fetched.first();
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
    const author = isInteraction ? context.user : (context.author || context.user || context.message?.author);
    const channel = context.channel || context.message?.channel;

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
      const msg = context.message || context;
      const mentions = msg.mentions || context.mentions;

      if (mentions?.members?.size > 0) {
        targetMember = mentions.members.first();
      } else if (mentions?.users?.size > 0) {
        const user = mentions.users.first();
        const guild = context.guild || msg.guild;
        targetMember = await guild?.members.fetch(user.id).catch(() => null) || user;
      }

      if (!targetMember) {
        if (Array.isArray(args) && args.length > 0) {
          targetQuery = args.join(' ').trim();
        } else if (Array.isArray(context.args) && context.args.length > 0) {
          targetQuery = context.args.join(' ').trim();
        } else if (typeof args === 'string' && args.trim()) {
          targetQuery = args.trim();
        } else if (typeof context.args === 'string' && context.args.trim()) {
          targetQuery = context.args.trim();
        } else {
          const raw = (msg.content || context.content || '').trim();
          if (raw) {
            const words = raw.split(/\s+/);
            if (words.length > 1) {
              targetQuery = words.slice(1).join(' ').trim();
            } else if (!words[0].toLowerCase().includes('kill')) {
              targetQuery = raw;
            }
          }
        }

        if (targetQuery) {
          targetMember = await resolveMember(context, targetQuery);
        }
      }

      if (!targetMember) {
        const replyFunc = (content) => (context.reply ? context.reply(content) : channel.send(content));
        if (!targetQuery) {
          return replyFunc('⚠️ Please specify who to eliminate! (e.g. `mmkill @user` or `mmkill username`)');
        }
        return replyFunc(`❌ Could not find any member matching **"${targetQuery}"** in this server.`);
      }
    }

    const targetUser = targetMember.user || targetMember;

    if (targetUser.id === author.id) {
      const msg = "You can't eliminate yourself! Stay alive! 🛡️";
      return isInteraction ? context.editReply(msg) : (context.reply ? context.reply(msg) : channel.send(msg));
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
        await channel.send({ embeds: [embed] });
      }
    } catch {
      const fallback = `*eliminated* <@${targetUser.id}>! 💀`;
      if (isInteraction) await context.editReply(fallback);
      else await channel.send(fallback);
    }
  }
};
