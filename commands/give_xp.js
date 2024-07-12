const {SlashCommandBuilder} = require('discord.js')
const userDb = require('../Schemas/user')
const {createUser, logAction} = require('../utilities')
const {levelCheck} = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('give_xp')
    .setDescription(`Gives a user a certain amount of XP.`)
    .addUserOption(option => option.setName('user').setDescription('The user whose XP you wish to update.').setRequired(true))
    .addStringOption(option => option.setName('type').setDescription('Which XP type you wish to update. Valid options are: voice, chat, event').setRequired(true))
    .addNumberOption(option => option.setName('amount').setDescription('The amount of xp you wish to add.').setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.get('user').value
        const xpAmount = interaction.options.get('amount').value
        const xpType = interaction.options.get('type').value

        let userDoc = await userDb.findOne({discordId : userId})
        if (!userDoc) {
            userDoc = await createUser(userId)
        }

        if (xpType === 'chat') {
            levelCheck(userId,xpAmount,'chat')
        } else if (xpType === 'voice') {
            levelCheck(userId,xpAmount,'voice')
        } else if (xpType === 'event') {
            userDoc.eventXp += xpAmount
            await userDoc.save()
        } else {
            await interaction.reply({content : `Please provide a valid xp type. Allowed types are : "chat","voice","event".`,ephemeral : true})
            return
        }
        interaction.reply({content : `Successfully added ${xpAmount} xp of type "${xpType}" to <@${userId}>`,ephemeral : true})
        logAction(interaction,'Give XP',userId)
    }
}