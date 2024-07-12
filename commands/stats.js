const {SlashCommandBuilder,EmbedBuilder} = require('discord.js')
const userDb = require('../Schemas/user')
const {createUser} = require('../utilities')

module.exports = {
    data : new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows the stats of the specified user.')
    .addUserOption(option => option.setName('user').setDescription('The user whose stats you wish to see.').setRequired(true)),

    /**
     * 
     * @param {Number} level 
     * @param {Number} userXp 
     * @returns progressString
     */
    generateString(level,userXp) {
        let xpString = ''
        const xpToNextLevel = 500+level*(250*(1.004)^level)
        let emojisDone = 0
        let xpFormPrevious
        if (level > 0) {
            let X = level -= 1
            xpFormPrevious = 500+X*(250*(1.004)^X)
        } else {
            xpFormPrevious = 0
        }

        const xpToGet = xpToNextLevel-xpFormPrevious
        const xpPerEmoji = Math.floor(xpToGet/10)

        for (let i = 0; i < xpToGet && i + xpPerEmoji <= xpToGet && i < userXp - xpFormPrevious; i += xpPerEmoji) {
            emojisDone ++
            xpString += `:green_square: `
        }

        
        if (10 - emojisDone > 0) {
            for (let i = emojisDone; i <= 10; i ++) {
                xpString += `       `
            }
        }
        
        const percentage = xpToGet/100
        const userLevelProgressXp = userXp - xpFormPrevious

        const userPercentage = userLevelProgressXp/percentage
        const roundedPercentage = Math.round(userPercentage * 100)/100

        xpString += `${roundedPercentage}%`
        return xpString
    },

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            let userDoc = await userDb.findOne({discordId : userId})

            if (!userDoc) {
                userDoc = await createUser(userId)
            }
            const xpProgress = this.generateString(userDoc.chatLevel,userDoc.xp)
            const voiceProgress = this.generateString(userDoc.voiceLevel,userDoc.voiceXp)
            
            const guildMember = await interaction.guild.members.fetch(`${userId}`)
            const embed = new EmbedBuilder()
            .setTitle(`Stats`)
            .setAuthor({name : guildMember.user.globalName,iconURL : guildMember.user.avatarURL()})
            .setColor('#3dbbf5')
            .addFields(
                {name : 'Chat level', value : `${userDoc.chatLevel}`,inline : false},
                {name : `Chat XP`, value : `${userDoc.xp}`},
                {name : 'Chat level progress', value : xpProgress,inline : false},
                {name : 'Voice level', value : `${userDoc.voiceLevel}`,inline : false},
                {name : `Voice XP`, value : `${userDoc.voiceXp}`},
                {name : `Voice level progress`, value : voiceProgress,inline : false},
                {name : 'Event XP', value : `${userDoc.eventXp}`}
            )

            interaction.reply({content : ' ',embeds : [embed],ephemeral : true})

            
        } catch (err) {
            console.log(err)
            interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}