const {Schema,model} = require('mongoose')

const banSchema = new Schema({
    discordUserId : {type : String,required : true},
    moderator : {type : Number,required : true},
    reason : {type : String,required : true},
    expiration : {type : Number},
    timeOfIssue : {type : Number,required : true}
},{collection : 'bannedUsers'})

module.exports = model('bannedUsers',banSchema)