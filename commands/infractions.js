const {SlashCommandBuilder,EmbedBuilder,ButtonBuilder,ButtonStyle,ActionRowBuilder,ComponentType} = require('discord.js')
const userSchema = require('../Schemas/user')

module.exports = {
    whitelistRequired : true,
    data : new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('Displays the warnings a user has received.')
    .addUserOption(option => option.setName('user').setDescription('The user whose warnings you wish to see.').setRequired(true)),

    handlePage(pageArray) {
        let pageString = ''
        for (const page of pageArray) {
            let string = ''
            string += `**ID** : ${page.id}`
            string += ` **Reason** : ${page.reason}`
            string += ` **Time of warning** : <t:${page.timeOfIssue}>`
            string += ` **Moderator** : <@${page.moderator}> \n`
            pageString += string
        }
        return pageString
    },

    async execute(interaction) {
        const user = interaction.options.get('user').value
        const userDoc = await userSchema.findOne({discordId : user})
        const pages = []
        let currentPage = -1
        let embedString = "None"

        if (userDoc && userDoc.infractions.length !== 0) {
            while (userDoc.infractions.length > 0) {
                const page = userDoc.infractions.splice(0,10)
                pages.push(page)
            }
            currentPage = 0
            embedString = this.handlePage(pages[0])
        }

        const embed = new EmbedBuilder()
        .setTitle('Infractions')
        .setColor('#3dbbf5')
        .addFields(
            {name : ' ',value : embedString}
        )
        .setFooter({text : `Page ${currentPage + 1} of ${pages.length}`})

        if (pages.length > currentPage + 1) {
            const forwardButton = new ButtonBuilder()
            .setCustomId('forwardButton')
            .setLabel('Next page')
            .setStyle(ButtonStyle.Primary)

            const previousButton = new ButtonBuilder()
            .setCustomId('previousButton')
            .setLabel('Previous page')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)

            const row = new ActionRowBuilder()
            .addComponents(forwardButton,previousButton)

            const interactionResponse = await interaction.reply({content : ' ',embeds : [embed],ephemeral : true,components : [row]})

            const collector = interactionResponse.createMessageComponentCollector({ComponentType : ComponentType.Button, time : 120000})
            collector.on('collect', async (buttonInteraction) => {
                let newString = ''

                if (buttonInteraction.customId === 'forwardButton') {
                    currentPage ++
                    newString = this.handlePage(pages[currentPage])
                    if (pages.length === currentPage + 1) {
                        forwardButton.setDisabled(true)
                        previousButton.setDisabled(false)
                    } else {
                        forwardButton.setDisabled(true)
                        previousButton.setDisabled(false)
                    }
                } else if (buttonInteraction.customId === 'previousButton') {
                    currentPage --
                    newString = this.handlePage(pages[currentPage])
                    if (currentPage === 0) {
                        forwardButton.setDisabled(false)
                        previousButton.setDisabled(true)
                    } else {
                        forwardButton.setDisabled(false)
                        previousButton.setDisabled(true)
                    }
                }

                const newEmbed = new EmbedBuilder()
                .setTitle('Infractions')
                .setColor('#3dbbf5')
                .addFields(
                    {name : ' ',value : newString}
                )
                .setFooter({text : `Page ${currentPage + 1} of ${pages.length}`})
                buttonInteraction.deferUpdate()
                await interaction.editReply({content : ' ',embeds : [newEmbed],components : [row],ephemeral : true})
            })

        } else {
            await interaction.reply({content : ' ',embeds : [embed],ephemeral : true})
        }
    }
}