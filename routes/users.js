var express = require('express');
var router = express.Router();
var Users = require('../models/users')
var Rooms = require('../models/rooms');
var Roles = require('../models/roles');
var Sessionuser = require('../models/session_user');
const Onebox = require('../models/onebox')
var crypto = require("crypto");
var md5 = require('md5');
const verifyToken = require('../service/verifyToken')
const jwt = require('jsonwebtoken');
const { read } = require('fs');
const verify = require('../service/sendemail');
const logger = require('../service/loggerfile');
const { token } = require('morgan');
const register = require('../service/register_oneid')
const cron = require('node-cron');
const expires = require('../service/datetime');
const servicepassword = require('../service/reset_Password');
const code = require('../service/hashcode')

// router.get('/',async function(req, res) {
//   try {
//     let user = await Users.find({'name' : req.body.name  })
//     res.send(user)
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// });

// router.post('/register',async function(req, res) {
//   try {
//     let role = await Roles.findOne({'name' : 'user'})    
//     let checkemail = await Users.findOne({'email': req.body.email})
//     let checkphone = await Users.findOne({'phonenumber': req.body.phonenumber})
//     let checkusername = await Users.findOne({'username': req.body.username})
//     if (checkemail) 
//       res.send({status:'error',message:'Email already used'})
//     if(checkphone)
//       res.send({status:'error',message:'Phonenumber already used'})
//     if(checkusername)
//       res.send({status:'error',message:'Username already used'}) 
//     if (req.body.password  !== req.body.passwordconfirm)
//       res.send({status:'error',message:'The password does not match'})
//     if (req.body.password.length === 0 && req.body.passwordconfirm.length === 0) {
//       res.send({status:'error',message:'Please enter the password'})
//     }
//     if(!checkemail && !checkphone && !checkusername && req.body.password  === req.body.passwordconfirm){
//       let user = new Users({
//         username: req.body.username,
//         email : req.body.email,
//         password : md5(req.body.password + 'inetconference@inet!'),
//         name : req.body.name,
//         lastname : req.body.lastname,
//         phonenumber : req.body.phonenumber,
//         company : req.body.company,
//         oneid : null,
//         room_id : '',
//         role : role._id,
//         avatar_profile: `${process.env.DOMAIN}/image/profile/userdefault.png`,
//         verifyemail: false,
//         created_at : Date.now(),
//         updated_at : Date.now(),
//       })
//       let room = new Rooms({
//         user_id : user._id,
//         name : "Meeting_Room",
//         uid : user.name.substr(0, 3) +'-'+crypto.randomBytes(2).toString('hex') +'-'+crypto.randomBytes(2).toString('hex'),
//         key : md5('default'),
//         setting : {
//           MuteUserJoin: false,
//           ModeratorApproveBeforeJoin: false,
//           AllowAnyUserStartMeeting: false,
//           AllUserJoinAsModerator: false,
//           SecretRoom:false
//         },
//         created_at : Date.now(),
//         updated_at : Date.now(),
//       })
//       user.room_id = room._id
//       await user.save()
//       await room.save()
//       verify.confirm_email(user.email,user.name,user.lastname)
//       res.send({status:'success',message:'register success',user: user, room : room})
//     }
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// });

router.post('/registeroneid', async function (req, res){
  let username = req.body.username,
  password = req.body.password ,
  passwordconfirm = req.body.passwordconfirm ,
  name = req.body.name,
  lastname = req.body.lastname,
  mobile_no = req.body.phonenumber,
  company = req.body.company
  let phone = await Users.findOne({'phonenumber':mobile_no})
  if (phone) {
    res.send({status:'error',message:'Phonenumber already used'})
  }else if(password != passwordconfirm){
    res.send({status:'error',message:'The password does not match'})
  }else{
    let registeroneid = await register.Oneid(username,password,name,lastname,mobile_no)
    if (registeroneid) {
      if(registeroneid.result == 'Success'){
        let role = await Roles.findOne({'name' : 'host'})    
        let user = new Users({
          username: username,
          email : registeroneid.data.email,
          name : name,
          lastname : lastname,
          phonenumber : mobile_no,
          company : company,
          oneid : registeroneid.data.accountID,
          room_id : '',
          role : role._id,
          avatar_profile: `${process.env.DOMAIN}/image/profile/userdefault.png`,
          verifyemail: false,
          created_at : Date.now(),
          updated_at : Date.now(),
        })
        async function checkUidroom(){ // check uid room duplicate
          let uid = user.name.substr(0, 3) +'-'+crypto.randomBytes(2).toString('hex') +'-'+crypto.randomBytes(2).toString('hex')
          let checkuid = await Rooms.findOne({'uid':uid})
          return checkuid ?  checkUidroom() :  uid;
        }
        let room = new Rooms({
          user_id : user._id,
          name : "Meeting Room",        
          uid : await checkUidroom(),
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
        verify.confirm_email(user.email,user.name,user.lastname)
        logger.info(`email: ${user.email},message: Register successfully.`)
        res.send({status:'success',message:`${user.email} Register successfully.`,user: user, room : room})
      }else
        res.status(400).send({status:'error',message: registeroneid.errorMessage})
    }else
      res.status(400).send({status:'error',message:'Register oneid fail.'})
  }
})

// router.put('/update',verifyToken,async function(req, res) {
//   try {
//     jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
//       if(err){
//         res.send({status:'error',message:err})
//       }else{
//         let sessionuser = await Sessionuser.findOne({'token': req.token,'email': authData.user.email})
//         if (sessionuser) {
//           let user = await Users.findOne({'_id':authData.user._id})
//           let room = await Rooms.findOne({'_id':authData.room._id})
//           let userphone = await Users.findOne({'phonenumber':req.body.phonenumber})
//           if (userphone == null || req.body.phonenumber == authData.user.phonenumber) {
//             if (user && room) {
//               user.name = req.body.name
//               user.lastname = req.body.lastname
//               user.company = req.body.company
//               user.phonenumber = req.body.phonenumber
//               user.updated_at = Date.now()
//               jwt.sign({user ,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
//                 if(err)
//                   res.send({status:'tokenError',message:err})
//                 else{
//                   sessionuser.token = token
//                   await user.save()
//                   await sessionuser.save()
//                   logger.info(`email: ${user.email}, message: User information was successfully updated.`)
//                   res.send({status:'success',message:'User information was successfully updateds',token: token })
//                 }
//               })
//             }
//           }else
//             res.send({status:'error',message:'This phone number has already been used.'})
//         }else 
//           res.send({status:'error',message:'Token expired'})
//       }
//     })
//   } catch(error){
//     console.log(error);
//     res.send(error)
//   }
// })

  

router.post('/changepassword',verifyToken, async function(req, res) {
  try {
    jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        res.send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser) {
          let resetpassword  = await servicepassword.resetPassword(sessionuser.username)
          if (resetpassword.result == 'Success') {
            logger.info(`email: ${sessionuser.email}, message: Forgot Password`)
            res.send({status:'success',message:`Send email ${sessionuser.email} for recovery password.`,email: sessionuser.email})
          }else
            res.status(400).send({status:'error',message:'Email is not in the server.'})
        }else
          res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

// router.post('/checksessionuser', async function (req,res){
//   try {
//     let check = await Sessionuser.findOne({'email':req.body.email})
//     if (check) {
//       if (check.token == req.body.token) {
//         res.send({status:'Stay',message:'Same token.'})
//       }else
//         res.send({status:'logout',message:"Not the same token session timeout."})
//     }else
//       res.send({status:'error',message:"There are no users in the session."})
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// })

router.get('/verifyemail/:emailToken',async function(req,res){
  try {
    jwt.verify(req.params.emailToken , process.env.SECRET_TOKEN, async (err, data)=>{
      if (err) {
        res.send(err)
      }else{
        let user = await Users.findOne({'email': data.email})
        if (user) {
          user.verifyemail = true
          user.save()
          logger.info(`email: ${user.email}, message: Verify email successfully`)
          res.redirect(process.env.domain_frontend+'?status='+encodeURIComponent('activemail'))
        }else
          res.status(400).send({status:'error',message:'Email is not in the server.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

// router.post('/recoverypassword',async function(req,res){
//   try {
//     let user = await Users.findOne({'email': req.body.email})
//     if (user) {
//       if (req.body.newpassword === req.body.confirmpassword) {
//         user.password = md5(req.body.newpassword + 'inetconference@inet!') 
//         await user.save()
//         logger.info(`email: ${user.email},message: Successfully recovered the password.`)
//         res.send({status:'success',message:'Successfully recovered the password.'})
//       }else{
//         logger.error(`email: ${user.email},message: The password does not match.`)
//         res.send({status:'error',message:'The password does not match.'})
//       }
//     }else
//       res.send({status:'error',message:'Email is not in the server.'})
      
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// })

router.post('/forgot',async function (req,res){
  try {
    let data = await Users.findOne({'username': req.body.username})
    if (data) {
      let forgot  = await servicepassword.resetPassword(data.username)
      if (forgot.result == 'Success') {
        logger.info(`email: ${data.email}, message: Forgot Password`)
        res.send({status:'success',message:`Send email ${data.email} for recovery password.`,email: data.email})
      }else
        res.send({status:'error',message:'Email is not in the server.'})
      // verify.recoveryPassword(data.email)
    }else{
      res.send({status:'error',message:'Email is not in the server.'})
    }
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/checkroleuser',verifyToken,async function (req,res){
  try {
    jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send(err)
      }else{
        let role = await Roles.findOne({'_id': authData.user.role},'name')
        role ? res.json({status:'success',role:role})
        :res.status(400).json({status:'error',message:'role id is wrong.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

module.exports = router;
