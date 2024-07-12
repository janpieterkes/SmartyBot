const {SlashCommandBuilder,EmbedBuilder} = require('discord.js')
const {suggestionChannelId} = require('../config.json')

module.exports = {
    data : new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Creates a suggestion.')
    .addStringOption(option => option.setName('suggestion').setDescription('Your suggestion, please provide as much details as possible.').setRequired(true)),

    async execute(interaction) {
        try {
            const suggestion = interaction.options.get('suggestion').value
            const channels = interaction.guild.channels
            const suggestionChannel = await channels.fetch(suggestionChannelId)

            const embed = new EmbedBuilder()
            .setColor('#3dbbf5')
            .setAuthor({name : interaction.user.username,iconURL : interaction.user.avatarURL()})
            .addFields(
                {name : 'Suggestion',value : suggestion}
            )

            await suggestionChannel.send({embeds : [embed]})

            await interaction.reply({content : `Successfully submitted your suggestion!`,ephemeral : true})
        } catch (err) {
            console.log(err)
            await interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}