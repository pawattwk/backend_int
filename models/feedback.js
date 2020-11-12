const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    // id : { type:String,unique: true,min: 1 },
    score : { type:Number, default: 0 },
    message : { type:String, default: '' },
    room : { type:String, default: '' },
    created_at : { type:String, default: '' },
}, { collection: 'Feedback' })

module.exports = mongoose.model('Feedback', Schema)