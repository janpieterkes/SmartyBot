const userDb = require('./Schemas/user')
const {EmbedBuilder, GuildMember, ChatInputCommandInteraction} = require('discord.js')
const {logsChannelId} = require('./config.json')

module.exports = {
    async createUser(userId) {
        if (!userId) {
            return new Error('Please provide a discord user ID.')
        }
        const newUser = new userDb({
            discordId : userId,
            infractions : [],
            xp : 0,
            eventXp : 0,
            voiceXp : 0,
            chatLevel : 0,
            voiceLevel : 0,
        })
        return newUser
    },

    async levelCheck(userId,xpIncrement,type) {
        const userDoc = await userDb.findOne({discordId : userId})
        
        if (type === 'chat') {

            userDoc.xp += xpIncrement
            let X = 0
            let currentXp = userDoc.xp
            while (currentXp >= 500+X*(250*(1.004)^X)) {
                X ++
            }
            userDoc.chatLevel = X

        } else if (type === 'voice') {
            userDoc.voiceXp += xpIncrement
            let X = 0
            let currentXp = userDoc.voiceXp
            while (currentXp >= 500+X*(250*(1.004)^X)) {
                X ++
            }
            userDoc.voiceLevel = X

        } else {console.log('Something went wrong')}

        userDoc.save()
    },

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction (Optional)
     * @param {string} actionType
     * @param {string} suspectId
     * @param {string} reason
     */
    async logAction(interaction,actionType,suspectId,reason) {
        const embed = new EmbedBuilder()
        .setColor('#3dbbf5')
        .setAuthor({name : interaction.user.username,iconURL : interaction.user.avatarURL()})
        .addFields(
            {name : 'Moderator', value : `<@${interaction.user.id}>`},
            {name : 'Suspect', value : `<@${suspectId}>`},
            {name : 'Action', value : actionType}
        )

        if (reason) {
            embed.addFields({name : 'Reason', value : reason})
        }

        const logsChannel = await interaction.guild.channels.fetch(logsChannelId)
        logsChannel.send({embeds : [embed]})
    }

}