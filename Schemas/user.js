const {Schema,model} = require('mongoose')

const userData = new Schema({
    discordId : {type : String,required : true},
    infractions : {type : Array,required : true},
    xp : {type : Number,required : true},
    chatLevel : {type : Number,required : true},
    eventXp : {type : Number, required : true},
    voiceXp : {type : Number, required : true},
    voiceLevel : {type : Number,required : true}
},{collection : 'userData'})

module.exports = model('userData',userData)