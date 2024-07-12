const {SlashCommandBuilder} = require('discord.js')
const userDb = require('../Schemas/user')
const {createUser, levelCheck, logAction} = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('set_xp')
    .setDescription(`Sets a users XP to a certain amount.`)
    .addUserOption(option => option.setName('user').setDescription('The user whose XP you wish to update.').setRequired(true))
    .addStringOption(option => option.setName('type').setDescription('Which XP type you wish to update. Valid options are: voice, chat, event').setRequired(true))
    .addNumberOption(option => option.setName('amount').setDescription('The amount of XP you wish to set.').setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.get('user').value
        const xpAmount = interaction.options.get('amount').value
        const xpType = interaction.options.get('type').value

        if (xpAmount < 0) {
            interaction.reply({content : `XP can't go negative.`,ephemeral : true})
            return
        }

        let userDoc = await userDb.findOne({discordId : userId})
        if (!userDoc) {
            userDoc = await createUser(userId)
        }

        if (xpType === 'chat') {
            userDoc.xp = xpAmount
            await userDoc.save()
            levelCheck(userId,0,'chat')
        } else if (xpType === 'voice') {
            userDoc.voiceXp = xpAmount
            await userDoc.save()
            levelCheck(userId,0,'voice')
        } else if (xpType === 'event') {
            userDoc.eventXp = xpAmount
            await userDoc.save()
        } else {
            await interaction.reply({content : `Please provide a valid xp type. Allowed types are : "chat","voice","event".`,ephemeral : true})
            return
        }
        interaction.reply({content : `Successfully set <@${userId}>'s xp of type "${xpType}" to ${xpAmount}`,ephemeral : true})
        logAction(interaction,'Set XP',userId)
    }
}