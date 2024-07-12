const {SlashCommandBuilder} = require('discord.js')
const userDb = require('../Schemas/user')
const { logAction } = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('edit_infraction')
    .setDescription('Edits the reason for a warning.')
    .addUserOption(option => option.setName('user').setDescription('The user whose warning you wish to edit.').setRequired(true))
    .addStringOption(option => option.setName('warning_id').setDescription('The ID of the warning you wish to edit.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The new reason for the warning.').setRequired(true)),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const warningId = interaction.options.get('warning_id').value
            const reason = interaction.options.get('reason').value

            const userDoc = await userDb.findOne({discordId : userId})
            if (!userDoc) {
                await interaction.reply({content : `<@${userId}> doesn't have any warnings.`,ephemeral : true})
                return
            }

            const warning = userDoc.infractions.find(warn => warn.id === warningId)
            if (!warning) {
                await interaction.reply({content : `Warning ${warningId} doesn't exist.`,ephemeral : true})
                return
            }

            const newWarning = {id : warning.id,moderator : warning.moderator,timeOfIssue : warning.timeOfIssue,type : 'warning',reason : reason}
            userDoc.infractions.splice(userDoc.infractions.indexOf(warning),1)
            userDoc.infractions.push(newWarning)
            await userDoc.save()
            await interaction.reply({content : `Successfully updated warning ${warningId}.`,ephemeral : true})
            logAction(interaction,'Edit infraction',userId,reason)

        } catch (err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}