const express = require('express')
const router = express.Router()
const crypto = require('crypto');
const verifyToken = require('./verifyToken')
const jwt = require('jsonwebtoken') 
const Microservice = require('../models/microservice')
const Sessionservice = require('../models/session_service')
const Sessionroom = require('../models/session_room');
const Historyroom = require('../models/history_rooms')
const logger = require('./loggerfile');
const code = require('./hashcode');
const md5 = require('md5');
const date_time = require('./datetime');
const expires = require('./datetime');
const cron = require('node-cron');


router.get('/createlink',verifyToken,async function(req, res) {
  try {
    const client_id = req.token,secret_key = req.body.secret_key,
    email = req.body.email,roomname = req.body.roomname,password = req.body.password
    let checktoken = await Microservice.findOne({'client_id':client_id})
    if (checktoken) {
      if (checktoken.secret_key === secret_key) {
        let token = code.decodeToken(checktoken.client_id,checktoken.secret_key)
        jwt.verify(token, checktoken.secret_key, async (err, Data)=>{
          if(err){
            console.log(err);
          }else{
            let session_service = new Sessionservice({
              service: Data.service,
              email: email,
              roomname: roomname === ''? 'Onemail_room' :roomname,
              uid: md5(email+Data.service+Date.now()),
              password: password===''? code.encode("123roominet!") : code.encode(checktoken.key+':inet!')
            })
            await session_service.save()

            cron.schedule(date_time.sessiontimeout(),async function(){
              await Sessionservice.findOneAndDelete({'uid' : session_service.uid })
              logger.info(`service: ${Data.service}, uid: ${session_service.uid}, message: Session service time out.`)
            });

            logger.info(`service: ${Data.service} request room.`)
            let room = `${process.env.domain_frontend}/join/?uuid=${session_service.uid}&?service=${Data.service}&?clientid=${checktoken.client_id}` 
            res.send(room)
          }
        })
      } else {
        logger.error(`secret_key error.`)
        res.status(400).json({status:'error',message:'secret_key error.'})
      }
    }else{
      logger.error(`client_id error.`)
      res.status(400).json({status:'error',message:'client_id error.'})
    }
  } catch (error) {
    console.log(error);
  }
 
})

router.post('/createsession',verifyToken,async function(req, res) {
  const client_id = req.token,uid = req.body.uid,name = req.body.name
  try {
    const checktoken = await Microservice.findOne({'client_id':client_id},['client_id','secret_key'])
    if (checktoken) {
      const token = code.decodeToken(checktoken.client_id,checktoken.secret_key)
      jwt.verify(token, checktoken.secret_key, async (err, Data)=>{
        const session = await Sessionservice.findOne({'uid':uid})
        if (session) {
          let sessionroom = await Sessionroom.findOne({'uid':uid})
          if (sessionroom) {
            res.status(400).json({status:'error',message:'The room has started.'})
          } else {
            let session_room = new Sessionroom({
              user_id : client_id,
              room_id : '',
              uid: uid,
              roomname : session.roomname === ''? 'Meeting_room' : session.roomname,
              name : name,
              username : Data.service,
              meeting_id : `${md5(session.uid + client_id)}-${Date.now()}`,
              option : 'video',
              key : session.password,
              setting: '',
              member : [{email: name, join_at : Date.now(), out_at : ''}],
              urlInvite: ''
            })
            let historyRoom = new Historyroom({
              user_id : client_id,
              meeting_id : session_room.meeting_id,
              name : session_room.roomname,
              username : session_room.username,
              uid : session_room.uid,
              date : date_time.date(),
              start_time : date_time.time(),
              end_time : '',
              setting: '',
              member : session_room.member,
            }) 
            session_room.urlInvite =`${process.env.domain_frontend}/join/?uuid=${session_room.uid}&?service=${Data.service}&?clientid=${checktoken.client_id}` 
            await historyRoom.save()
            await session_room.save()
            logger.info(`serviec: ${Data.service}, meetingid: ${session_room.meeting_id}, option: ${session_room.option}, message: Moderator start meeting room.`)
            let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
            res.json({status:'success',url:createUrl})
          }
        } else {
          res.status(400).json({status:'error',message:'The room has not started a meeting yet.'})
        }
      })
    }else{
      res.status(400).json({status:'error',message:'client_id error.'})
    }
  } catch (error) {
    console.log(error);
  }
})

router.post('/joinroom',verifyToken,async function(req, res) {
  const client_id = req.token,uid = req.body.uid,name = req.body.name
  let password=req.body.password
  try {
    const checktoken = await Microservice.findOne({'client_id':client_id},['client_id','secret_key'])
    if (checktoken) {
      const token = code.decodeToken(checktoken.client_id,checktoken.secret_key)
      jwt.verify(token, checktoken.secret_key, async (err, Data)=>{
        let checksession = await Sessionroom.findOne({'uid': uid})
        if (checksession) {
          if (password == '') key = code.encode("123roominet!")
          else key = code.encode(password+':inet!')
          if (name != '') {
            if (key != checksession.key) {
              logger.error(`name: ${name}, meetingid: ${checksession.meeting_id}, message: Wrong room password`)
              res.send({status:'error',message:"Wrong room password."})
            }else{
              let joinUrl = `${process.env.domain_conference}${checksession.meeting_id}?attendee?${name}?${checksession.key}?${checksession.option}?${checksession.roomname}?oneconference?${name}`
              console.log(joinUrl);
              let history = await Historyroom.findOne({'meeting_id': checksession.meeting_id})
              checksession.member.push({attendee: name, join_at : Date.now(), out_at : ''})
              history.member = checksession.member
              history.attendee = (checksession.member).length
              await checksession.save()
              await history.save()
              logger.info(`attendee: ${name}, meetingid: ${checksession.meeting_id}, message: Attendee join room meeting.`)
              res.send({status:'success',message:`Attendee ${name} join meeting room`,url:joinUrl})
            }
          }
          else
            res.status(400).json({status:'error',message:'Please fill in your name before entering the meeting.'})
        } else
        res.status(400).json({status:'error',message:"The room has not started a meeting yet."})
      })
    }else
      res.status(400).json({status:'error',message:'client_id error.'}) 
  } catch (error) {
    console.log(error);
  }
})

router.get('/checkroom/:uid',verifyToken,async function(req, res){
  const uid= req.params.uid,client_id= req.token
  try {
    const checktoken = await Microservice.findOne({'client_id':client_id},['client_id','secret_key'])
    if (checktoken) {
      const token = code.decodeToken(checktoken.client_id,checktoken.secret_key)
      jwt.verify(token, checktoken.secret_key, async (err, Data)=>{
        let checkservice = await Sessionservice.findOne({'uid': uid},'password')
        if (checkservice) {
          if (checkservice.password == '52b30c17980a0d1230d70088de17d960') checkservice.password = false
          else checkservice.password = true
          let checkuid = await Sessionroom.findOne({'uid':uid},'uid')
          if (checkuid){
            res.json({status:'success',password:checkservice.password,message:'show attendee.'})
          }
          else 
            res.json({status:'success',password:checkservice.password,message:'show modulater.',})
        } else {
          res.status(400).json({status:'error',message:'The room has not started a meeting yet.'})
        }
      })
    }else
      res.status(400).json({status:'error',message:'client_id error.'})
  } catch (error) {
    console.log(error);
  }
})
module.exports = router;