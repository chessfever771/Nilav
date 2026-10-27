const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setannouncement')
        .setDescription('Set a dedicated channel for music now-playing announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The text channel for music announcements')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const targetChannel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;

        // Verify bot permissions in the target channel
        const permissions = targetChannel.permissionsFor(client.user);
        if (!permissions.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
            return interaction.reply({
                content: `❌ I do not have permission to send embeds in ${targetChannel}. Please grant me **View Channel**, **Send Messages**, and **Embed Links**.`,
                ephemeral: true
            });
        }

        // Save to Titan's database/key-value storage
        // If your setup uses TitanBot's key-value db helper:
        if (client.db) {
            await client.db.set(`guild:${guildId}:music_announcement_channel`, targetChannel.id);
        }

        return interaction.reply({
            content: `✅ Music announcements will now be sent to ${targetChannel}.`,
            ephemeral: true
        });
    }
};
