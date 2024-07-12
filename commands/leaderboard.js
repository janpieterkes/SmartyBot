const {SlashCommandBuilder,EmbedBuilder} = require('discord.js')

module.exports = {
    data : new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows the chat leaderboard.')
    .addStringOption(option => option.setName('type').setDescription('Which leaderboard you wish to see. Valid options are: voice, chat, event').setRequired(true)),

    async execute(interaction) {
        try {
            const type = interaction.options.get('type').value
            if (type !== 'voice' && type !== 'event' && type !== 'chat') {
                interaction.reply({content : 'Please provide a valid leaderboard type. Allowed types are : "chat","voice","event".',ephemeral : true})
                return
            }

           const leaderboardArray = interaction.client.leaderboards.get(type)

            let userString = ''
            let startNumber = 0
            let leaderboardName = ''
            leaderboardArray.forEach(doc => {
                userString += `**${startNumber + 1}.** <@${doc.discordId}> `
                if (type === 'chat') {
                    leaderboardName = 'Chat leaderboard'
                    userString += `**XP:** ${doc.xp}\n`
                } else if (type === 'voice') {
                    leaderboardName = 'VC leaderboard'
                    userString += `**Minutes:** ${doc.voiceXp}\n`
                } else if (type === 'event') {
                    leaderboardName = 'Event XP leaderboard'
                    userString += `**Event XP:** ${doc.eventXp}\n`
                }
                startNumber += 1
            });

            const embed = new EmbedBuilder()
            .setColor('#3dbbf5')
            .addFields(
                {name : `${leaderboardName}`,value : userString}
            )
            interaction.reply({content : `Next leaderboard update at <t:${interaction.client.lastLeaderboardUpdate + 3600}:t> `,embeds : [embed],ephemeral : true})
        } catch (err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}