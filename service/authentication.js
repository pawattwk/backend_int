var express = require('express');
var router = express.Router();
const Users = require('../models/users')
const Rooms = require('../models/rooms');
const Sessionrooms = require('../models/session_room');
const Sessionuser = require('../models/session_user');
var md5 = require('md5');
const jwt = require('jsonwebtoken')  // ใช้งาน jwt module
const logger = require('./loggerfile')
const verifyToken = require('./verifyToken')
const login = require('./login_oneid')
const expires = require('./datetime')
const cron = require('node-cron');
const jwttoken = require('../service/jwttoken')
// router.post('/users', verifyToken , async function(req, res, next) {
//   jwt.verify(req.token , process.env.SECRET_TOKEN, (err, authData)=>{
//     if(err){
//       res.sendStatus(403)
//     }else{
//       res.json({message: 'login', authData})
//     }
//   })
// })


// router.post('/login',  async function(req, res) {
//   try {
//     let user = await Users.findOne({'email' : req.body.email })
//     if (user == null ) {
//       logger.error(`email or password is wrong!`);
//       res.send({status:'error',message: 'email or password is wrong!'})
//     }
//     else if (user && md5(req.body.password + 'inetconference@inet!') !== user.password) {
//       logger.error(`email or password is wrong!`);
//       res.send({status:'error',message: 'email or password is wrong!'})
//     }
//     // else if(users.verifyemail == false){
//     //   logger.error(`Please check your account verification.`);
//     //   res.send({status:'error',message: 'Please check your account verification.'})
//     // }
//     else{
//       let room = await Rooms.findOne({'user_id' : user._id})
//       let session = await Sessionuser.findOne({'email' : user.email})
//       if (session) {
//         jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
//           if(err){
//             res.send({status:'tokenError',message:err})
//           }else{
//             session.token = token
//             session.updated_at = Date.now()
//             await session.save()
//             logger.info(`email: ${session.email}, message: Login successfully`);
//             res.send({status:'Login Success',expiration_date:expires.nextdatetime,email:user.email,token:token})  
//           }      
//         })
//       }else{
//         //create token , session
//         jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
//           if(err){
//             res.send({status:'error',message:err})
//           }else{
//             let session = new Sessionuser({
//               username: user.username,
//               email: user.email,
//               oneid: null,
//               token: token,
//               created_at : Date.now(),
//               updated_at : Date.now(),
//             })
//             await session.save()
//             logger.info(`email: ${session.email}, message: Login successfully`);
//             res.send({status:'Login Success',expiration_date:expires.nextdatetime,email:user.email,token:token})  
//           }      
//         })
//       }
//       //delete session user when 24hr
//       cron.schedule(expires.sessiontimeout(),async function(){
//         await Sessionuser.findOneAndDelete({'email' : user.email})
//         logger.info(`email: ${user.email}, message: Session user timeout`);
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// });


router.post('/loginoneid', async function (req, res){
  try {
    let username = req.body.username,
        password = req.body.password
    let auth = await login.Oneid(username,password)
    if (auth) {
      var user = auth.user
      if (auth.logindata == 'Success') {
        var room = await Rooms.findOne({'user_id':user._id})
        let sessionuser = await Sessionuser.findOne({ $or:[{'username': username},{'email': username}]})
        if (sessionuser) {
          jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
            if(err){
              res.send({status:'tokenError',message:err})
            }else{
              sessionuser.token = token
              sessionuser.updated_at = Date.now()
              await sessionuser.save()
              await sessionuser_timeout(jwttoken.DecodeExpTime(token),sessionuser.email)
              logger.info(`email: ${sessionuser.email}, message: Login successfully`);
              res.send({status:'Login successfully',expiration_date: expires.expiretoken(jwttoken.DecodeExpTime(token),''),username:user.username,token:token})  
            }      
          })
        }else{
          var room = await Rooms.findOne({'user_id':user._id})
          jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
            if(err){
              res.send({status:'tokenError',message:err})
            }else{
              let session = new Sessionuser({
                username: user.username,
                email: user.email,
                oneid: user.oneid,
                token: token,
                created_at : Date.now(),
                updated_at : Date.now(),
              })
              await session.save()
              await sessionuser_timeout(jwttoken.DecodeExpTime(token),session.email)
              logger.info(`email: ${session.email}, message: Login successfully.`);
              res.send({status:'Login successfully',expiration_date: expires.expiretoken(jwttoken.DecodeExpTime(token),''),username:user.username,token:token})  
            }      
          })
        }
      }else if(auth.status === 'errorverification'){
        logger.error(`email: ${auth.email}, message: Please check your account verification.`)
        res.send({status:'error',message: 'Please check your account verification.'})
      }else{
        logger.error(`email: ${username}, message: username or password is wrong!.`)
        res.send({status:'error',message: 'username or password is wrong!.'})
      }
    }else{
      logger.error(`email: ${username}, message: username or password is wrong!.`)
      res.send({status:'error',message: 'username or password is wrong!'})
    }
    
    function sessionuser_timeout(exptime,email){
      //delete session user when 24hr
      cron.schedule(expires.expiretoken(exptime),async function(){
        await Sessionuser.findOneAndDelete({'email' : email})
        logger.info(`email: ${email}, message: Session user timeout`);
      });
    }
  } catch (error) {
    console.log(error);
  }
})

router.delete('/logout',verifyToken, async function (req, res) {
  try {
    jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        res.send(err)
      }else{
        let session = await Sessionuser.findOne({'token': req.token,'email' : authData.user.email})
        if(session){
          let user = await Users.findOne({'email': session.email})
          await Sessionrooms.findOneAndDelete({'user_id' : user._id})
          await session.delete()
          logger.info(`email: ${session.email}, message: Logout successfully`);
          res.send({status:'success',message:'Logout successfully'})  
        }
        else{
          res.status(401).send({status:'error',message:'Token expired'})
        }
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

module.exports = router;
