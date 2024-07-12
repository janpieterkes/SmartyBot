const {Schema,model} = require('mongoose')

const newSchema = new Schema({
    bans : {type : Array,required : true},
    kicks : {type : Array,required : true},
    mutes : {type : Array,required : true},
    warns : {type : Array,required : true}
},{collection : 'modstats'})

module.exports = model('modstats',newSchema)