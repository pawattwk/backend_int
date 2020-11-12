const mongoose = require('mongoose')

var Schema = new mongoose.Schema({
    client_name: {type:String, default: '' },
    client_id : {type:String, default: ''},
    secret_key : {type:String, default: ''},
    created_at : { type:Date, default: Date.now() },
    updated_at : { type:Date, default: Date.now() },
}, { collection: 'Microservice' })

module.exports = mongoose.model('Microservice', Schema)