import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { getGuildMusicData } from '../../services/music/playerHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setannouncement')
        .setDescription('Set the text channel for music now-playing announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The text channel to send music announcements to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const targetChannel = interaction.options.getChannel('channel');
        const guildId = interaction.guildId;

        const permissions = targetChannel.permissionsFor(client.user);
        if (!permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
            return interaction.reply({
                content: `I lack the required permissions (**View Channel**, **Send Messages**, **Embed Links**) in ${targetChannel}.`,
                ephemeral: true
            });
        }

        // Sets playerChannelId so playerHandler.js routes announcements here
        const guildData = getGuildMusicData(guildId);
        guildData.playerChannelId = targetChannel.id;

        if (client.db) {
            await client.db.set(`guild:${guildId}:playerChannelId`, targetChannel.id);
        }

        return interaction.reply({
            content: `Music announcements will now be sent to ${targetChannel}.`,
            ephemeral: true
        });
    }
};
