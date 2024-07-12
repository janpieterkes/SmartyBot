const {SlashCommandBuilder,ChannelType, ChatInputCommandInteraction} = require('discord.js')

module.exports = {
    data : new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlocks a text channel.')
    .addChannelOption(option => option.setName('channel').setDescription('The text channel you wish to unlock.').setRequired(true)),

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
            if (!channel.parent) {
                interaction.reply({content : `Please put the channel under a category before unlocking.`,ephemeral : true})
                return
            }
            
            await guild.roles.fetch()
            
            await channel.lockPermissions()
            interaction.reply({content : `Successfully unlocked.`,ephemeral : true})

        } catch(err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}