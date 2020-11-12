const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    roomname : { type:String, default: '' },
    meetingid : { type:String, default: '' },
    host_id : { type:String, default: '' },
    topic: { type:String, default: '' },
    PollList : { type:Array, default: [] },
    questions : { type:String, default: '0' },
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
}, { collection: 'Votes' })

module.exports = mongoose.model('Votes', Schema)