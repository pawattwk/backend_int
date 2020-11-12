const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    hostname : { type:String, default: '' },
    roomname : { type:String, default: '' },
    urlroom : { type:String, default: '' },
    keyroom : { type:String, default: '' },
    meeting_id : { type:String, default: '' },
    member : { type:Array},
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
}, { collection: 'session_roomonechat' })

module.exports = mongoose.model('session_roomonechat', Schema)