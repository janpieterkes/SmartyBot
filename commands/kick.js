const {SlashCommandBuilder} = require('discord.js')
const modstatsDb = require('../Schemas/modstats')
const { logAction } = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server.')
    .addUserOption(option => option.setName('user').setDescription('The user who you wish to kick.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the kick.').setRequired(true)),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const reason = interaction.options.get('reason').value
            const user = await interaction.guild.members.fetch(userId)
            const modDoc = (await modstatsDb.find({}))[0]
            modDoc.kicks.push({timeOfIssue : Date.now()})
            modDoc.save()

            await user.send(`You've been kicked from our server by <@${interaction.user.id}>\nReason : ${reason}`).catch(err => {})
            await user.kick(reason)

            await interaction.reply({content : `Successfully kicked <@${userId}>`,ephemeral : true})
            logAction(interaction,'Kick',userId,reason)
            
        } catch(err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}