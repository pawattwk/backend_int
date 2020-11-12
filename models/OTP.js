const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    oneid: {type:String, default: '' },
    OTP : {type:String, default: ''},
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
    conter_OTP : { type:Number , default: 0}
}, { collection: 'Session_OTP' })

module.exports = mongoose.model('Session_OTP', Schema)