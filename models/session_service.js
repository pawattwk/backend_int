const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    user_token: {type:String, default: '' },
    service:{type:String, default: '' },
    email: {type:String, default: '' },
    roomname: {type:String, default: '' },
    password : {type:String, default: ''},
    uid : {type:String, default: ''},
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
}, { collection: 'Session_service' })

module.exports = mongoose.model('Session_service', Schema)