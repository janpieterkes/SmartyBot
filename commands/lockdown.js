const {SlashCommandBuilder,ChannelType, ChatInputCommandInteraction} = require('discord.js')

module.exports = {
    data : new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Locks a text channel.')
    .addChannelOption(option => option.setName('channel').setDescription('The text channel you wish to lock.').setRequired(true)),

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    async execute(interaction) {
        try {
            const channelOption = interaction.options.get('channel')
            if (channelOption.channel.type != ChannelType.GuildText) {
                interaction.reply({content : `Please provide a valid text based channel.`,ephemeral : true})
                return
            }
            const guild = await interaction.client.guilds.fetch(interaction.guild.id)
            const channel  = await channelOption.channel.fetch()
            await guild.roles.fetch()
            
            
            await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
                SendMessages: false
            })
            interaction.reply({content : `Successfully locked.`,ephemeral : true})

        } catch(err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}