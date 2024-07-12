const {SlashCommandBuilder} = require('discord.js')
const userSchema = require('../Schemas/user')
const {createUser, logAction} = require('../utilities')
const options = ['1','2','3','4','5','6','7','8','9']
const modstatsDb = require('../Schemas/modstats')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Give a user a warning.')
    .addUserOption(option => option.setName('user').setDescription('The user who you wish to warn.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for the warning.').setRequired(true)),

    generateId() {
        let stringId = ''
        while (stringId.length < 13) {
            stringId += options[Math.floor(Math.random()*options.length)]
        }
        return stringId
    },

    async execute(interaction) {
        try {
            const userId = interaction.options.get('user').value
            const userDoc = await userSchema.findOne({discordId : userId})
            const warning = {id : this.generateId(),moderator : interaction.user.id ,timeOfIssue : Math.floor(Date.now() / 1000),type : 'warning',reason : interaction.options.get('reason').value}

            if (!userDoc) {
                const newUser = await createUser(userId)
                newUser.save()
            } else {
                userDoc.infractions.push(warning)
                userDoc.save()
            }

            const modDoc = (await modstatsDb.find({}))[0]
            modDoc.warns.push({timeOfIssue : Date.now()})
            modDoc.save()

            await interaction.reply({content : `Successfully warned <@${userId}>`,ephemeral : true})

            const user = await interaction.guild.members.fetch(`${userId}`)
            user.send(`You've been warned by <@${warning.moderator}> for ${warning.reason} \nPlease abide by our rules.`).catch(err => console.log(err.rawError.message))
            logAction(interaction,'Warn',userId,warning.reason)

        } catch (err) {
            console.log(err)
            await interaction.reply({content : `Something wen't wrong.`,ephemeral : true})
        }
    }
}