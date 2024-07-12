const {SlashCommandBuilder} = require('discord.js')
const { logAction } = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('softban')
    .setDescription(`Deletes a user's messages after kicking them out.`)
    .addUserOption(option => option.setName('user').setDescription('The user who you wish to softban.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the softban.').setRequired(true)),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const reason = interaction.options.get('reason').value
            const user = await interaction.guild.members.fetch(userId)

            await user.send(`You've been softbanned from our server by <@${interaction.user.id}>\nReason : ${reason}`).catch(err => console.log(err))

            await interaction.guild.members.ban(userId,{deleteMessageSeconds : 604800, reason : reason})
            await interaction.guild.members.unban(userId)

            await interaction.reply({content : `Successfully softbanned <@${userId}>`,ephemeral : true})
            logAction(interaction,'Softban',userId,reason)
            
        } catch(err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }

    }
}