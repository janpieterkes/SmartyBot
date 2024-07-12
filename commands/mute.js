const {SlashCommandBuilder} = require('discord.js')
const modstatsDb = require('../Schemas/modstats')
const { logAction } = require('../utilities')
const times = {
    '60 sec' : 60000,
    '5 min' : 300000,
    '10 min' : 600000,
    '1 hour' : 3600000,
    '1 day' : 86400000,
    '1 week' : 604800000,
    '1 month' : 16934400000
}

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Prevents a user from sending messages for a certain amount of time.')

    .addUserOption(option => option.setName('user').setDescription('The use who you wish to mute.').setRequired(true))
    .addStringOption(option => option.setName('duration').setDescription('The duration of the mute.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the mute.').setRequired(true)),

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const reason = interaction.options.get('reason').value
            const member = await interaction.guild.members.fetch(`${userId}`)
            const duration = interaction.options.get('duration').value
            const durationInMiliSec = times[duration]

            if (!durationInMiliSec) {
                interaction.reply({content : `Please provide a valid time option. Valid options are: "60 sec","5 min","10 min",'1 hour',"1 day","1 week","1 month"`,ephemeral : true})
                return
            }

            await member.timeout(durationInMiliSec,`${reason} | Muted by ${interaction.user.id}`)
            member.send(`You've muted by <@${interaction.user.id}>\nReason : ${reason}\nDuration : ${duration}`).catch()
            await interaction.reply({content : `Successfully muted <@${userId}> for ${duration}.`,ephemeral : true})
            logAction(interaction,'Mute',userId,reason)

            const modDoc = (await modstatsDb.find({}))[0]
            const statsObject = {timeOfIssue : Date.now()}
            modDoc.mutes.push(statsObject)
            modDoc.save()


        } catch(err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    },
}