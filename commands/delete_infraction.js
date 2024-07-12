const {SlashCommandBuilder} = require('discord.js')
const userSchema = require('../Schemas/user')
const { logAction } = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('delete_infraction')
    .setDescription(`Deletes a warning from a user's account.`)
    .addUserOption(option => option.setName('user').setDescription('The user whose warning you wish to remove.').setRequired(true))
    .addStringOption(option => option.setName('warning_id').setDescription('The id of whe warning you wish to delete. You can find it using /infractions.').setRequired(true)),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const warningId = interaction.options.get('warning_id').value
            const userDoc = await userSchema.findOne({discordId : userId})

            if (!userDoc) {
                await interaction.reply({content : `User <@${userId}> does not have any warnings.`,ephemeral : true})
                return
            }
            const warningObject = userDoc.infractions.find(object => object.id === warningId)

            if (!warningObject) {
                await interaction.reply({content : `Warning ${warningId} does not exist.`,ephemeral : true})
                return
            }

            userDoc.infractions.splice(userDoc.infractions.indexOf(warningObject),1)
            await userDoc.save()
            interaction.reply({content : `Successfully removed ${warningId} from <@${userId}>.`,ephemeral : true})
            logAction(interaction,'Delete infraction',userId)

        } catch (err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}