const {SlashCommandBuilder,EmbedBuilder} = require('discord.js')
const modstatsDb = require('../Schemas/modstats')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('modstats')
    .setDescription('Shows the server modstats.'),

    filterElements(array,sevenDaysAgo) {
        let inPastWeek = 0
        for (const element of array) {
            if (sevenDaysAgo < element.timeOfIssue) {
                inPastWeek ++
            }
        }
        return inPastWeek
    },

    async execute(interaction) {
        const modDoc = (await modstatsDb.find({}))[0]
        const sevenDaysAgo = Date.now() - 604800000
        const embed = new EmbedBuilder()
        .setTitle('Modstats')
        .setColor('#3dbbf5')
        .addFields(
            {name : 'Warnings (Total)',value : `${modDoc.warns.length}`},
            {name : 'Kicks (Total)', value : `${modDoc.kicks.length}`},
            {name : 'Bans (Total)', value : `${modDoc.bans.length}`},
            {name : 'Mutes (Total)', value : `${modDoc.mutes.length}`},
            {name : 'Warns (Last 7 days)', value : `${this.filterElements(modDoc.warns,sevenDaysAgo)}`},
            {name : 'Kicks (Lasy 7 days)',value : `${this.filterElements(modDoc.kicks,sevenDaysAgo)}`},
            {name : 'Bans (Lasy 7 days)',value : `${this.filterElements(modDoc.bans,sevenDaysAgo)}`},
            {name : 'Mutes (Lasy 7 days)',value : `${this.filterElements(modDoc.mutes,sevenDaysAgo)}`}
        )
        interaction.reply({content : ' ',embeds : [embed],ephemeral : true})
    }
}