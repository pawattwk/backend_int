const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    username : { type:String ,default: '' },
    email : { type:String, default: '', unique: true, },
    oneid : { type:String, default: null},
    token : { type:String, default: null},
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
}, { collection: 'Session_user' })

module.exports = mongoose.model('Session_user', Schema)