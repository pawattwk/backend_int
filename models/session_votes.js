const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    meetingid : { type:String, default: '' },
    host_id : { type:String, default: '' },
    PollList : { type:Array, default: [] },
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
}, { collection: 'Session_votes' })

module.exports = mongoose.model('Session_votes', Schema)