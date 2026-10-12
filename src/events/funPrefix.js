import { EmbedBuilder } from 'discord.js';

const PREFIX = 'mm';

// Phrases per action
const PHRASES = {
  pat: (u, t) => `*gives* <@${t.id}> *soft headpats* ✨`,
  hug: (u, t) => `*wraps arms tightly around* <@${t.id}> *giving a warm hug!* 🤗💖`,
  cuddle: (u, t) => `Sending 100% pure cuddle energy to <@${t.id}>! ✨`,
  kiss: (u, t) => `*plants a soft kiss on* <@${t.id}>*'s cheek!* 💋✨`,
  kill: (u, t) => `*completely annihilates* <@${t.id}>! 💀💥`
};

// nekos.best endpoints
const API_ENDPOINTS = {
  pat: 'pat',
  hug: 'hug',
  cuddle: 'cuddle',
  kiss: 'kiss',
  kill: 'shoot'
};

// Validates whether the typed target actually exists in the server
async function resolveMember(message, query) {
  if (!query) return null;

  // 1. Direct @mention
  if (message.mentions.members.size > 0) {
    return message.mentions.members.first();
  }

  // 2. Discord User ID
  const cleanId = query.replace(/[<@!>]/g, '');
  if (/^\d{17,19}$/.test(cleanId)) {
    const byId = await message.guild.members.fetch(cleanId).catch(() => null);
    if (byId) return byId;
  }

  // 3. Username or Server Nickname search
  const search = query.toLowerCase();
  return message.guild.members.cache.find(m =>
    m.user.username.toLowerCase() === search ||
    m.displayName.toLowerCase() === search
  ) || null;
}

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Check if the message starts with 'mm'
    const content = message.content.trim();
    if (!content.toLowerCase().startsWith(PREFIX)) return;

    // Split command and argument
    const args = content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase(); // e.g. "kill", "hug"

    if (!['pat', 'hug', 'cuddle', 'kiss', 'kill'].includes(command)) return;

    const targetQuery = args[0];

    // 1. Block if no username/mention was provided
    if (!targetQuery) {
      return message.reply(`⚠️ Please specify who to ${command}! (e.g. \`${PREFIX}${command} @user\`)`);
    }

    // 2. Validate member existence
    const targetMember = await resolveMember(message, targetQuery);

    if (!targetMember) {
      return message.reply(`❌ Could not find any member matching **"${targetQuery}"** in this server.`);
    }

    // 3. Prevent self-kill
    if (targetMember.id === message.author.id && command === 'kill') {
      return message.reply("You can't eliminate yourself! 🛡️");
    }

    try {
      const endpoint = API_ENDPOINTS[command];
      const res = await fetch(`https://nekos.best/api/v2/${endpoint}`, {
        headers: { 'User-Agent': 'TitanBot/1.0 (DiscordBot)' }
      });
      const data = await res.json();
      const gifUrl = data.results[0]?.url;

      const phrase = PHRASES[command](message.author, targetMember.user);

      const embed = new EmbedBuilder()
        .setColor(command === 'kill' ? '#e74c3c' : '#ff4081')
        .setDescription(phrase)
        .setImage(gifUrl);

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(`Error executing ${command}:`, err);
    }
  }
};
