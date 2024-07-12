const {SlashCommandBuilder,EmbedBuilder} = require('discord.js')
const {bugChannelId} = require('../config.json')

module.exports = {
    data : new SlashCommandBuilder()
    .setName('report_bug')
    .setDescription('Creates a bug report.')
    .addStringOption(option => option.setName('bug').setDescription('The bug you wish to report. Please provide as much detials as possible.').setRequired(true)),

    async execute(interaction) {
        try {
            const bug = interaction.options.get('bug').value
            const channel = await interaction.guild.channels.fetch(bugChannelId)
            const embed = new EmbedBuilder()
            .setColor('#3dbbf5')
            .setAuthor({name : interaction.user.username,iconURL : interaction.user.avatarURL()})
            .addFields(
                {name : 'Bug', value : bug}
            )

            channel.send({embeds : [embed]})
            await interaction.reply({content : `Successfully submitted your bug report.`,ephemeral : true})

        } catch(err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}