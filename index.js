require('dotenv').config()
const discord = require('discord.js')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const config = require('./config.json')
const userDb = require('./Schemas/user')
const modstatsDb = require('./Schemas/modstats')
const {createUser, levelCheck, logAction} = require('./utilities')

const REST = new discord.REST().setToken(process.env.discordToken)
const bot = new discord.Client({intents : [discord.IntentsBitField.Flags.Guilds,discord.IntentsBitField.Flags.DirectMessages,discord.GatewayIntentBits.MessageContent]})
bot.login(process.env.discordToken)



bot.once('ready', async () => {
    console.log(`${bot.user.username} is ready to rumble!`)
})

mongoose.pluralize(null)
mongoose.connect(process.env.mongoURI,{dbName : 'SmartyBot'}).catch(err => console.log(err)).then(console.log('Connected to MongoDB!'))

modstatsDb.find({}).then(docs => {
    if (docs.length === 0) {
        console.log('Creating new modstats document.')
        const modDoc = new modstatsDb({
            bans : [],
            kicks : [],
            mutes : [],
            warns : []
        })
        modDoc.save()
    }
})

bot.on(discord.Events.InteractionCreate, async (interaction) => {
    if (!interaction.guild) {
        return
    }
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName)

        if (command.whitelistRequired) {

            const user = await interaction.guild.members.fetch(interaction.user.id)

            if (config.testingMode === false) {
                for (const roleId of config.whitelistedRoles) {
                    if (user.roles.cache.has(roleId)) {
                        command.execute(interaction)
                        return
                    }
                }
                interaction.reply({content : `You don't have the required permissions for this command.`,ephemeral : true})
                return
            }

        }

        command.execute(interaction)
    }
})

// Deploy commands
const filePath = path.join(__dirname,'commands')
bot.commands = new discord.Collection()

for (const file of fs.readdirSync(filePath)) {
    const command = require(path.join(filePath,file))
    bot.commands.set(command.data.name,command)
};

async function deployCommands() {
    try {
        const serverCommands = []
        await bot.commands.forEach(async command => {
            serverCommands.push(command.data.toJSON())
        });
        const data = await REST.put(
            discord.Routes.applicationCommands(process.env.appId,process.env.guildId),
            {body : serverCommands}
        )
        console.log(`Successfully deployed ${data.length} command(s)!`)
    } catch(err) {console.log(err)}
}

async function startBanChecks() {
    const banSchema = require('./Schemas/ban')
    const bans = await banSchema.find({})
    const guild = await bot.guilds.fetch(process.env.guildId)

    for (const banDoc of bans) {
        const now = Date.now()

        if (!banDoc.expiration) {
            continue
        }
        
        if (now >= banDoc.expiration) {

            try {
                await banSchema.deleteOne({discordUserId : banDoc.discordUserId})
                await guild.members.unban(`${banDoc.discordUserId}`)
            } catch (err) {
                console.log(err)
            }

        } else {
            setTimeout( async () => {
                try {
                    await banSchema.deleteOne({discordUserId : banDoc.discordUserId})
                    await guild.members.unban(`${banDoc.discordUserId}`)
                } catch (err) {
                    console.log(err)
                }
            },banDoc.expiration - now)
        }
    }
}

async function levelLoop() {
    try {  
        const guild = await bot.guilds.fetch(process.env.guildId)
        bot.lastMessages = new discord.Collection()
        
        for (const id of config.levelChannels) {
            const channel = await guild.channels.fetch(id)
            const lastMessage = await channel.messages.fetch({limit : 1,cache : false})
            bot.lastMessages.set(id,{lastMessage : lastMessage.first(),channel : channel})
        }

        setInterval(async () => {
            let xpCollection = new discord.Collection()
            
            const promise = new Promise((resolve,reject)=> {
                config.levelChannels.forEach(async (id) => {
                    const channelInfo = bot.lastMessages.get(id)

                    let messageCollection
                    if (!channelInfo.lastMessage) {
                        messageCollection = await channelInfo.channel.messages.fetch()
                    } else {
                        messageCollection = await channelInfo.channel.messages.fetch({after : channelInfo.lastMessage.id})
                    }
                    
                    if (messageCollection.size > 0) {
                        messageCollection.forEach((message) => {
                            const userId = message.author.id
                            let xp = xpCollection.get(userId) || 0
                            xp += config.baseMessageXP
                            const extraXp = config.aditionalCharacterXP*message.content.length
                            xp += extraXp
                            xpCollection.set(userId,{xp : xp,userId : userId})
                        })

                        bot.lastMessages.set(id,{lastMessage : messageCollection.first(), channel : channelInfo.channel})
                        resolve()
    
                    } else console.log('No messages'); resolve()
                }) 
            })

            promise.then(() => {
                console.log('Done')
                xpCollection.forEach(async object => {
                    const userDoc = await userDb.findOne({discordId : object.userId})
                    if (!userDoc) {
                        const newDoc = await createUser(object.userId)
                        newDoc.xp += object.xp
                        newDoc.save()
                    } else {
                        levelCheck(object.userId,object.xp,'chat')
                    }
                })
            }).catch(err => console.log(err))

        },60000)

    } catch (err) {

    }
}


async function voiceLoop() {
    try {
        const guild = await bot.guilds.fetch(process.env.guildId)

        setInterval(() => {
            const voiceChannels = new discord.Collection()

            const init = new Promise((resolve,reject) => {
                config.voiceLevelChannels.forEach(async channelId => {
                    const channel = await guild.channels.fetch(channelId)
                    voiceChannels.set(channelId,channel)
                    if (voiceChannels.size === config.voiceLevelChannels.length) {
                        resolve()
                    }
                })
            })

            init.then(() => {
                console.log('Starting')
                voiceChannels.forEach(channel => {
                    channel.members.forEach(async guildMember => {
                        let userDoc = await userDb.findOne({discordId : guildMember.id})
                        if (!userDoc) {
                            userDoc = await createUser(guildMember.id)
                        }
                        userDoc.voiceXp ++
                        userDoc.save()
                        console.log(`Gave ${guildMember.id} XP`)
                    })
                })
            })




        },60000);



    } catch (err) {
        console.log(err)
    }
}


async function updateLeaderboard() {
    const chat = (await userDb.find({}).sort({xp : "descending"}).exec()).slice(0,9)
    const voice = (await userDb.find({}).sort({voiceXp : "descending"}).exec()).slice(0,9)
    const event = (await userDb.find({}).sort({eventXp : "descending"}).exec()).slice(0,9)
    bot.leaderboards = new discord.Collection()
    bot.leaderboards.set('chat',chat)
    bot.leaderboards.set('voice',voice)
    bot.leaderboards.set('event',event)
    bot.lastLeaderboardUpdate = Math.floor(Date.now() / 1000)

    console.log('Loaded leaderboard.')

    setInterval(async () => {
        const chat = (await userDb.find({}).sort({xp : "descending"}).exec()).slice(0,9)
        const voice = (await userDb.find({}).sort({voiceXp : "descending"}).exec()).slice(0,9)
        const event = (await userDb.find({}).sort({eventXp : "descending"}).exec()).slice(0,9)
        bot.leaderboards = new discord.Collection()
        bot.leaderboards.set('chat',chat)
        bot.leaderboards.set('voice',voice)
        bot.leaderboards.set('event',event)
        bot.lastLeaderboardUpdate = Math.floor(Date.now() / 1000)

        console.log('Updated leaderboard')

    }, 3600000);
}

updateLeaderboard()
deployCommands()
startBanChecks()
levelLoop()
voiceLoop()