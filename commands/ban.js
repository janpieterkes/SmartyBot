require('dotenv').config()
const {SlashCommandBuilder} = require('discord.js')
const banDb = require('../Schemas/ban')
const userDb = require('../Schemas/user')
const modstatsDb = require('../Schemas/modstats')
const { logAction } = require('../utilities')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server. If no duration is specified the ban will be permanent.')
    .addUserOption(option => option.setName('user').setDescription('The user who you wish to ban.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the ban.').setRequired(true))
    .addNumberOption(option => option.setName('duration').setDescription('The duration of the ban in HOURS.')),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const user = await interaction.guild.members.fetch(userId)
            const reason = interaction.options.get('reason').value
            let durationInHours = interaction.options.get('duration')
            let duration = 'Permanent.'

            if (!user.bannable) {
                await interaction.reply({content : `I don't have the required permissions to perform this action.`,ephemeral : true})
                return
            }

            const moderator = await interaction.guild.members.fetch(interaction.user.id)
            if (user.roles.highest.postion >= moderator.roles.highest) {
                await interaction.reply({content : `You can't ban this user.`,ephemeral : true})
                return
            }

            const ban = new banDb({
                discordUserId : `${userId}`,
                moderator : interaction.user.id,
                reason : reason,
                timeOfIssue : Date.now()
            })
            if (durationInHours) {
                durationInHours = durationInHours.value
                const now = Date.now()
                ban.expiration = now + (durationInHours * 3600000)
                duration = `${durationInHours} hour(s).`
            }

            userDb.deleteOne({discordId : userId})
            await user.send(`You've been banned from our server by <@${interaction.user.id}>\nReason : ${reason}\nDuration : ${duration}`).catch(err => console.log(err))

            await ban.save()
            await interaction.guild.members.ban(user,{deleteMessageSeconds : 604800,reason : reason})

            interaction.reply({content : `Successfully banned <@${userId}>`,ephemeral : true})
            logAction(interaction,'Ban',userId,reason)

            const modDoc = (await modstatsDb.find({}))[0]
            const statsObject = {timeOfIssue : Date.now()}
            modDoc.bans.push(statsObject)
            modDoc.save()

            setTimeout(async () => {
                console.log('deleted old ban')
                await interaction.guild.members.unban(ban.discordUserId)
                await banDb.deleteOne({discordUserId : ban.discordUserId})
            },ban.expiration - Date.now())

        } catch(err) {
            if (err.rawError.code === 10013 || err.rawError.code === 10007) {
                await interaction.reply({content : `Please provide a valid userId.`,ephemeral : true})
                return
            }
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
        
    }
}