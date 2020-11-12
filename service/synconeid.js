const express = require('express')
const router = express.Router()
const axios = require('axios')
const users = require('../models/users')
const rooms = require('../models/rooms')
const Roles = require('../models/roles')
const crypto = require("crypto")
const md5 = require('md5')

router.post('/',async function(req, res) {
  let code  = req.body.code;
  let data = {  
    "grant_type" : "authorization_code", 
      "client_id" : process.env.ONEID_CLIENT_ID, 
      "client_secret" : process.env.ONEID_CLIENT_SECRET,  
      "code" : code, 
      "scope" : "",
  }
  try {
    let token = await axios.post(process.env.ONEID_API_AUTH, data);
    let USER_TOKEN = token.data.access_token
    const AuthStr = 'Bearer '.concat(USER_TOKEN); 
    let datauser = await axios.get( process.env.ONEID_API_ACCOUNT , { headers: { Authorization: AuthStr } })
    let user = await users.findOne({oneid: datauser.data.id})
    if(user){
      let room = await rooms.findOne({user_id: user.user_id })
      res.status(200).send({
        data:{
          user: user,
          room: room
        }
      })
    }else{
      let role = await Roles.findOne({'name' : 'user'})    
      let user = new users({
      name : datauser.data.thai_email.split('@')[0],
      email : datauser.data.thai_email,
      password : md5(datauser.data.id),
      phonenumber : datauser.data.mobile[0].mobile_no,
      oneid : datauser.data.id,
      room_id : '',
      role : role._id,
      created_at : Date.now(),
      updated_at : Date.now(),
    })
      let room = new rooms({
      user_id : user._id,
      name : "Room",
      uid : user.name.substr(0, 3) +'-'+crypto.randomBytes(2).toString('hex') +'-'+crypto.randomBytes(2).toString('hex'),
      meeting_id : crypto.randomBytes(20).toString('hex'),
      last_session : '',
      created_at : Date.now(),
      updated_at : Date.now(),
    })
      user.room_id = room._id
      await user.save()
      await room.save()
      res.status(200).send({
        data:{
          user: user,
          room: room
        }
      })
    }
  } catch (error) {
    console.log(error)
    res.send({
      status: 'Error',
      error: error 
    })
  } 
})

module.exports = router