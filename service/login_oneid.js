const axios = require('axios')
const Users = require('../models/users')
const Rooms = require('../models/rooms')
const Roles = require('../models/roles')
const onebox = require('../service/onebox')
var md5 = require('md5');
var crypto = require("crypto");
const code = require('./hashcode')

async function Oneid(username,password){
  try {
    let data = {
      "grant_type":"password",
      "client_id": process.env.ONEID_CLIENT_ID,
      "client_secret": process.env.ONEID_CLIENT_SECRET,
      "username": username,
      "password": password
    }
    let login = await axios.post(process.env.ONEID_API_LOGIN, data);
    let user = await Users.findOne({ $or:[{'username': username},{'email': username}]})
    if (user) {
      if (user.verifyemail == false) {
        return {status:'errorverification',email:user.email}
      }else{
        if (login) {
          if (login.data.result === 'Success') {
            const token = login.data.access_token
            const authtoken = `Bearer ${token}`
            let getUser = await axios.get(process.env.ONEID_API_ACCOUNT, {headers: {Authorization: authtoken}});
              if (getUser) {
                let datauser = getUser.data
                // let user = await Users.findOne({ $or:[{'username': login.data.username},{'email': datauser.email[0].email}]})
                  // let room = await Rooms.findOne({'user_id':user._id})
                  user.name = datauser.first_name_eng,
                  user.lastname = datauser.last_name_eng,
                  user.phonenumber = datauser.mobile[0].mobile_no,
                  user.oneid = datauser.id,
                  await user.save()
                  await onebox.getonebox(token,datauser.id)
                  user.role = await onebox.getLimitMeeting(user.email)
                  return {
                    logindata:login.data.result,
                    user:user,
                    // room:room
                  }
              }
          }
        }
        // }if (user.verifyemail == false) {
        //   return {status:'errorverification'}
        // }else{
        //     return login.data
      }
    }else{
      if (login) {
        if (login.data.result === 'Success') {
          const token = login.data.access_token
          const authtoken = `Bearer ${token}`
          let getUser = await axios.get(process.env.ONEID_API_ACCOUNT, {headers: {Authorization: authtoken}});
            if (getUser) {
            let datauser = getUser.data
                let user = new Users({
                  username: login.data.username,
                  email : datauser.email[0].email,
                  name : datauser.first_name_eng,
                  lastname : datauser.last_name_eng,
                  phonenumber : datauser.mobile[0].mobile_no,
                  company : 'inet',
                  oneid : datauser.id,
                  room_id : '',
                  role : null,
                  avatar_profile: `${process.env.DOMAIN}/image/profile/userdefault.png`,
                  verifyemail: true,
                  created_at : Date.now(),
                  updated_at : Date.now(),
                })
                let room = new Rooms({
                  user_id : user._id,
                  name : "Meeting_Room",
                  uid : user.name.substr(0, 3) +'-'+crypto.randomBytes(2).toString('hex') +'-'+crypto.randomBytes(2).toString('hex'),
                  key : code.encode("123roominet!"),
                  setting : {
                    MuteUserJoin: false,
                    ModeratorApproveBeforeJoin: false,
                    AllowAnyUserStartMeeting: false,
                    AllUserJoinAsModerator: false,
                    SecretRoom:false,
                    OneboxAccountid: null,
                    Lobby: false
                  },
                  created_at : Date.now(),
                  updated_at : Date.now(),
                })
                user.room_id = room._id
                await user.save()
                await room.save()
                await onebox.getonebox(token,datauser.id)
                user.role = await onebox.getLimitMeeting(user.email)
                return {
                  logindata:login.data.result,
                  user:user,
                  // room:room
                }
          }
        }
      }
    }
  } 
  catch (error) {
    console.log(error);
  }
}

module.exports ={
  Oneid
}
