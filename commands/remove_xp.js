const {SlashCommandBuilder} = require('discord.js')
const userDb = require('../Schemas/user')
const {createUser, levelCheck, logAction} = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('remove_xp')
    .setDescription(`Removes a certain amount of XP from a user.`)
    .addUserOption(option => option.setName('user').setDescription('The user whose XP you wish to update.').setRequired(true))
    .addStringOption(option => option.setName('type').setDescription('Which XP type you wish to update. Valid options are: voice, chat, event').setRequired(true))
    .addNumberOption(option => option.setName('amount').setDescription('The amount of xp you wish to remove.').setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.get('user').value
        const xpAmount = interaction.options.get('amount').value
        const xpType = interaction.options.get('type').value

        let userDoc = await userDb.findOne({discordId : userId})
        if (!userDoc) {
            interaction.reply({content : `<@${userId}> has no xp yet.`,ephemeral : true})
            return
        }

        if (xpType === 'chat') {
            if (userDoc.xp - xpAmount < 0) {
                interaction.reply({content : `XP can't go negative.`,ephemeral : true})
                return
            }
            levelCheck(userId,xpAmount*-1,'chat')
        } else if (xpType === 'voice') {
            if (userDoc.voiceXp - xpAmount < 0) {
                interaction.reply({content : `XP can't go negative.`,ephemeral : true})
                return
            }
            levelCheck(userId,xpAmount*-1,'voice')
        } else if (xpType === 'event') {
            if (userDoc.eventXp - xpAmount < 0) {
                interaction.reply({content : `XP can't go negative.`,ephemeral : true})
                return
            }
            userDoc.eventXp -= xpAmount
            await userDoc.save()
        } else {
            await interaction.reply({content : `Please provide a valid xp type. Allowed types are : "chat","voice","event".`,ephemeral : true})
            return
        }
        interaction.reply({content : `Successfully removed ${xpAmount} xp of type "${xpType}" from <@${userId}>`,ephemeral : true})
        logAction(interaction,'Remove XP',userId)
    }
}