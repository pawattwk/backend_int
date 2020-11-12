var express = require('express')
var router = express.Router()
var multer  = require('multer')
var fs = require('fs-extra')
var upload = multer({ dest: 'uploads/' })
var User = require('../models/users')
var Room = require('../models/rooms')
var Sessionuser = require('../models/session_user')
const jwt = require('jsonwebtoken')
const verifyToken = require('../service/verifyToken')
const logger = require('../service/loggerfile');
const { loggers } = require('winston');

router.post('/pictureprofile', upload.single('avatar'),verifyToken, async function (req, res, next) {
  try {
    jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        res.send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser) {
          let user = await User.findOne({'_id' : authData.user._id})
          let room = await Room.findOne({'_id': authData.room._id})
          var originalname =  req.file.mimetype.split('/')
          if (user && room) {
            if(user.avatar_profile){
              if(req.file){
                fs.removeSync(  './assets/profile/'+user._id+'.'+originalname[originalname.length-1])
                fs.moveSync(req.file.path,'./assets/profile/'+user._id+'.'+originalname[originalname.length-1])
                user.avatar_profile = process.env.DOMAIN+'/image/profile/'+user._id+'.'+originalname[originalname.length-1]
                jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
                  if(err)
                    res.send({status:'error',message:err})
                  else{   
                    sessionuser.token = token
                    await user.save()
                    await sessionuser.save()
                    logger.info(`email: ${user.email}, message: Successfully changed profile picture.`)
                    res.send({status:'success',message: 'Successfully changed profile picture.',file:req.file,token:token})
                  }
                })
              }else{
                res.json({status:'error',error:'invalid file'})
              }
            }
            else{
              fs.moveSync(req.file.path,'./assets/profile/'+user._id+'.'+originalname[originalname.length-1])
              user.avatar_profile = process.env.DOMAIN+'/image/profile/'+user._id+'.'+originalname[originalname.length-1]
              // await user.save()
              jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
                if(err)
                  res.send({status:'error',message:err})
                else{   
                  sessionuser.token = token
                  await user.save()
                  await sessionuser.save()
                  logger.info(`email: ${user.email}, message: Successfully changed profile picture.`)
                  res.send({status:'success',message: 'Successfully changed profile picture.',file:req.file,token:token})
                }
              })
            }
          }
        }else
          res.status(401).send({status:'error',message:'Token expired'})
      }
    }) 
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})


module.exports = router