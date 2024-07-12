const {SlashCommandBuilder,EmbedBuilder} = require('discord.js')
const userCl = require('../Schemas/user')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('view_infraction')
    .setDescription('Displays information about a specific warning.')
    .addUserOption(option => option.setName('user').setDescription('The user whose warning you wish to view.').setRequired(true))
    .addStringOption(option => option.setName('warning_id').setDescription('The id of the warning you wish to view.').setRequired(true)),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const warningId = interaction.options.get('warning_id').value
            const userDoc = await userCl.findOne({discordId : userId})

            if (!userDoc) {
                await interaction.reply({content : `<@${userId}> doesn't have any warnings.`,ephemeral : true})
                return
            }

            const warning = userDoc.infractions.find(warning => warning.id === warningId)
            if (!warning) {
                await interaction.reply({content : `Warning ${warningId} doesn't exist.`,ephemeral : true})
                return
            }

            const embed = new EmbedBuilder()
            .setTitle(`Warning ${warningId}`)
            .setColor('#3dbbf5')
            .addFields(
                {name : 'ID',value : warningId},
                {name : 'Reason',value : `${warning.reason}`},
                {name : 'Moderator',value : `<@${warning.moderator}>`},
                {name : 'Time of issue',value : `<t:${warning.timeOfIssue}>`}
            )

            await interaction.reply({content : ` `,embeds : [embed],ephemeral : true})

        } catch(err) {
            console.log(err)
            await interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}