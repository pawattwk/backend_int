var express = require('express');
var router = express.Router();
const Rooms = require('../models/rooms');
const Users = require('../models/users');
const Sessionroom = require('../models/session_room');
const Sessionuser = require('../models/session_user');
const Historyroom = require('../models/history_rooms')
const Sessionservice = require('../models/session_service')
const Votes = require('../models/votes')
const Schedulemeeting = require('../models/schedule_meeting')
const Roles = require('../models/roles');
const verifyToken = require('../service/verifyToken')
const jwt = require('jsonwebtoken')  
const sha1 = require('sha1')
const md5 = require('md5')
const logger = require('../service/loggerfile');
const date_time = require('../service/datetime');
const { loggers, error } = require('winston');
const sendMail = require('../service/sendemail');
const cron = require('node-cron');
const expires = require('../service/datetime');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const code = require('../service/hashcode');
const sendemail = require('../service/sendemail');
const roles = require('../models/roles')
const PDFDocument = require("pdfkit");
const {createPDF} = require('../service/genPDF')
const {createICS} = require('../service/calendarICS')

router.post('/createsession',verifyToken,async function(req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.aggregate([
          { $lookup:{ // join
            from: "Users",
            localField: "email",
            foreignField : "email",
            as: "user_result" }
          },
          { $match : { 'email' : authData.user.email,'token': req.token }}, //where
          { $project: { // select
            email: 1, user_result: { limit:1,license:1 } 
          }}
        ])
        if (sessionuser.length) {
          var checklimit = sessionuser[0].user_result[0]
          let checksession = await Sessionroom.findOne({'user_id': authData.user._id},'_id')
          if (checksession) {
            res.send({status:'error',message:'The chat room has started, Wait until the meeting is finished.'})
          }
          else if (checklimit.limit >= 5) {
            logger.error(`email: ${authData.user.email}, message: Your account is correct Limited to use this month..`)
            res.status(403).send({status:'error',message:'Your account is correct Limited to use this month.'})
          }else{
            let checksession = await Sessionroom.findOne({'user_id': authData.user._id},'_id')
            if (checksession) {
              res.send({status:'error',message:'The chat room has started, Wait until the meeting is finished.'})
            }else{
              let role = await Roles.findOne({'_id':authData.user.role},'name')
              let session_room = new Sessionroom({
                user_id : authData.user._id,
                room_id : authData.room._id,
                uid: authData.room.uid,
                roomname : authData.room.name,
                name : authData.user.name,
                username : authData.user.username,
                meeting_id : `${md5(authData.room.uid + authData.user.user_id)}-${Date.now()}`,
                option : 'video',
                key : authData.room.key,
                setting: authData.room.setting,
                member : [{email: authData.user.email, join_at : Date.now(), out_at : ''}],
                urlInvite: '',
                created_at: Date.now(),
                updated_at: Date.now()
              })
              let historyRoom = new Historyroom({
                user_id : session_room.user_id,
                meeting_id : session_room.meeting_id,
                name : session_room.roomname,
                username : session_room.username,
                uid : session_room.uid,
                date : date_time.date(session_room.created_at),
                start_time : date_time.time(session_room.created_at),
                end_time : '',
                setting: authData.room.setting,
                member : [{email: authData.user.email, join_at : session_room.created_at, out_at : ''}],
                created_at: session_room.created_at,
                updated_at: session_room.created_at
              }) 
              session_room.urlInvite = `${process.env.domain_frontend}/join/?uuid=${session_room.uid}`
              let votes = await Votes.findOne({'host_id': authData.user._id, 'meetingid': ''})
              if (votes) {
                votes.roomname = session_room.roomname
                votes.meetingid = session_room.meeting_id
                await votes.save()
              }
              await historyRoom.save()
              await session_room.save()
              if (role.name === 'citizen') {
                try {
                  if (checklimit.limit === 0) {
                    cron.schedule(date_time.nextmonth(checklimit.license),async function(){
                      // reset limit start meeting when Complete 30 day.
                      logger.info(`email: ${authData.user.email},role: ${role.name}, message: limit meeting clear.`)
                      await Users.updateOne( { _id: authData.user._id }, [ { $set: { "limit": 0,'license': new Date()} } ] )
                    })
                    checklimit.limit += 1
                    await Users.updateOne( { _id: authData.user._id }, [ { $set: { "limit": checklimit.limit} } ] )
                    await sendcreateURL(session_room)
                  }
                  else{
                    checklimit.limit += 1
                    await Users.updateOne( { _id: authData.user._id }, [ { $set: { "limit": checklimit.limit} } ] )
                    await sendcreateURL(session_room)
                  }
                } catch (error) {
                  console.log(error);
                }
              }else{
                await sendcreateURL(session_room)
              }  
          }
          
            function sendcreateURL(session_room){
              //  destroy session room in 24 hr
              cron.schedule(expires.sessiontimeout(),async function(){
                await Sessionroom.findOneAndDelete({'meeting_id' : session_room.meeting_id })
                logger.info(`email: ${authData.user.email}, meetingid: ${session_room.meeting_id}, option: ${session_room.option}, message: Session room time out.`)
              });
              logger.info(`email: ${authData.user.email}, meetingid: ${session_room.meeting_id}, option: ${session_room.option}, message: Moderator start meeting room.`)
              let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
              console.log(createUrl);
              res.send({status:'success',message:`Moderator ${authData.user.email} Start meeting room.`,meetingid:session_room.meeting_id ,url:createUrl})
            }
          }
        }else
          res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.get('/check/:uid',async function(req, res){
  try {
    let checkuid = await Sessionroom.findOne({'uid':req.params.uid},['key','user_id','roomname','setting'])
    if (checkuid){
      if (checkuid.key == '52b30c17980a0d1230d70088de17d960')
        checkuid.key = false
      else
        checkuid.key = true
      let user = await Users.findOne({'_id': checkuid.user_id},['_id','name','lastname'])
      if (user) {
        console.log(checkuid);
        res.send({
          status:'Success',
          message:'Room has in session.',
          fullname:`${user.name} ${user.lastname}`,
          roomname:checkuid.roomname,
          secretRoom:checkuid.setting.SecretRoom,
          key:checkuid.key,
          Lobby:checkuid.setting.Lobby
        })
      }else
        res.status(400).send({status:'Error', message:'No user in session'})
    }
    else 
      res.status(400).send({status:'Error',message:'The room has not started a meeting yet.'})
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/unauth/joinroom',async function(req, res){
  try {
    let checksession = await Sessionroom.findOne({'uid': req.body.roomuid})
    let key ='',name = req.body.name
    if (req.body.key == '') key = code.encode("123roominet!")
    else key = code.encode(req.body.key+':inet!')
    if (checksession) {
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
      } else {
        res.status(400).json({status:'error',message:'Please fill in your name before entering the meeting.'})
      }
    }else
      res.status(400).json({status:'error',message:"The room has not started a meeting yet."})
    
    
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/joinroom',verifyToken,async function(req, res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser){
          let checksession = await Sessionroom.findOne({'uid': req.body.roomuid})
          let key ='',name = ''
          if (req.body.key == '') key = code.encode("123roominet!")
          else key = code.encode(req.body.key+':inet!')
          
          if (req.body.name == '') {
            name = authData.user.name
          } else {
            name = req.body.name
          }
          
          if (checksession) {
            if (key!= checksession.key) {
              logger.error(`email: ${authData.user.email}, meetingid: ${checksession.meeting_id}, message: Wrong room password`)
              res.status(400).send({status:'error',message:"Wrong room password."})
            }else{
              let joinUrl = `${process.env.domain_conference}${checksession.meeting_id}?attendee?${name}?${checksession.key}?${checksession.option}?${checksession.roomname}?oneconference?${authData.user._id}`
              console.log(joinUrl);
              let member = await Sessionroom.findOne({'member.email': authData.user.email})
              let history = await Historyroom.findOne({'meeting_id': checksession.meeting_id})
              if (member) {
                logger.info(`email: ${authData.user.email}, meetingid: ${checksession.meeting_id}, message: Attendee join room meeting again.`)
                res.send({status:'success',message:`Attendee ${authData.user.email} join meeting room`,url:joinUrl})
              }
              else{
                checksession.member.push({email: authData.user.email, join_at : Date.now(), out_at : ''})
                history.member = checksession.member
                history.attendee = (checksession.member).length
                await checksession.save()
                await history.save()
                logger.info(`email: ${authData.user.email}, meetingid: ${checksession.meeting_id}, message: Attendee join room meeting.`)
                res.send({status:'success',message:`Attendee ${authData.user.email} join meeting room`,url:joinUrl})
              }
            }
          }else
            res.status(400).send({status:'error',message:"The meeting hasn't started yet."})
        }else
        res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/schedulemeeting',verifyToken ,async function(req,res){
  const email = req.body.email,
  option1 = req.body.option1,
  option2 = req.body.option2,
  option3 = req.body.option3,
  option4 = req.body.option4,
  option5 = req.body.option5,
  option6 = req.body.option6
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser){
          let user = await Users.findOne({'email':authData.user.email})
          let room = await Rooms.findOne({'user_id':user._id},'setting')
          if (user) {
            let schedule = new Schedulemeeting({
              user_id : authData.user._id,
              meeting_id : `${md5(authData.room.uid + authData.user.user_id)}-${Date.now()}`,
              name : req.body.subject,
              email: authData.user.email,
              username: authData.user.username,
              uid : authData.room.uid,
              date : date_time.dateschedule(req.body.date),
              start_time : req.body.time,
              end_time : date_time.addminutes(req.body.date,req.body.time,req.body.duration),
              option : 'video',
              key : '',
              setting: '',
              urlInvite: ''
            })
            if (req.body.key == '') 
              schedule.key = code.encode("123roominet!")
            else
              schedule.key = code.encode(req.body.key+':inet!')

            let setting = settingroom(option1,option2,option3,option4,option5,option6)
            var option = {
              'MuteUserJoin':setting[0],
              'ModeratorApproveBeforeJoin':setting[1],
              'AllowAnyUserStartMeeting':setting[2],
              'AllUserJoinAsModerator':setting[3],
              'SecretRoom':setting[4],
              'OneboxAccountid':  req.body.onebox_accountid != ''? req.body.onebox_accountid : room.setting.OneboxAccountid,
              'Lobby': setting[5]
            };
            schedule.setting = option
            schedule.urlInvite = `${process.env.domain_frontend}/join/?uuid=${schedule.uid}`
            let password = schedule.key === '52b30c17980a0d1230d70088de17d960' ? '' : code.decode(schedule.key).split(":")[0]

            if(email != ''){
              const ics = createICS(
                schedule.date,
                schedule.start_time,
                schedule.end_time,
                schedule.name,
                schedule.urlInvite,
                password
              ),
              emails =  email.split(',')
              emails.forEach(element => {
                 sendMail.calendar(element,ics)
                 logger.info(`email: ${user.email}, meetingid: ${schedule.meeting_id}, message: Send calendar successfully to ${element}`)
               });
            }

            await schedule.save()
            logger.info(`email: ${user.email}, meetingid: ${schedule.meeting_id}, message: Create schedule meeting Successfully`)
            res.send({status:'success',message:'Create schedule meeting Successfully.',data:schedule})
          }
        }else
          res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.put('/updateschedule',verifyToken,async function(req,res){
  const meetingid = req.body.meeting_id,
  subject = req.body.subject,
  date = req.body.date,
  time = req.body.time,
  duration = req.body.duration,key=req.body.key,
  onebox_accountid = req.body.onebox_accountid,
  option1 = req.body.option1,
  option2 = req.body.option2,
  option3 = req.body.option3,
  option4 = req.body.option4,
  option5 = req.body.option5,
  option6 = req.body.option6
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser){
          let room = await Rooms.findOne({'user_id':authData.user._id},'setting')
          let schedule = await Schedulemeeting.findOne({'meeting_id': meetingid},["name",'date','start_time','end_time','key','setting'])
          if (schedule) {
            schedule.name = subject,
            schedule.date = date_time.dateschedule(date),
            schedule.start_time = req.body.time,
            schedule.end_time = date_time.addminutes(date,time,duration),
            schedule.key = key==''?code.encode("123roominet!"):code.encode(key+':inet!')
            let setting = settingroom(option1,option2,option3,option4,option5,option6)
            var option = {
              'MuteUserJoin':setting[0],
              'ModeratorApproveBeforeJoin':setting[1],
              'AllowAnyUserStartMeeting':setting[2],
              'AllUserJoinAsModerator':setting[3],
              'SecretRoom':setting[4],
              'OneboxAccountid':  onebox_accountid != ''? onebox_accountid : room.setting.OneboxAccountid,
              'Lobby': setting[5]
            };
            schedule.setting = option
            schedule.save()
            logger.info(`email: ${authData.user.email}, message: Update schedule meeting Successfully`)
            res.json({status:'success',message:'Update schedule meeting Successfully.',data:schedule})
          }else
          res.status(400).send({status:'error',message:'meetingid is wrong.'})
        }else
        res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  }catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/startschedule',verifyToken,async function(req,res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
          if (sessionuser){
            let schedule = await Schedulemeeting.findOne({'meeting_id': req.body.meetingid})
            if (schedule) {
              let date = schedule.date.split("/"),
              day = date[0],
              month = date[1]
              year = date[2]
              const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
              const starttime = Date.parse(`${day} ${monthNames[month-1]} ${year} ${schedule.start_time}:00 GMT+0700 (Indochina Time)`);  
              const endtime =  Date.parse(`${day} ${monthNames[month-1]} ${year} ${schedule.end_time}:00 GMT+0700 (Indochina Time)`);  
              if (Date.now() >= starttime && Date.now() <= endtime   ) {
                let session_room = new Sessionroom({
                  user_id : authData.user._id,
                  room_id : authData.room._id,
                  uid: schedule.uid,
                  roomname : schedule.name,
                  name : authData.user.name,
                  username : schedule.username,
                  meeting_id : schedule.meeting_id,
                  option : 'video',
                  key : schedule.key,
                  setting: schedule.setting,
                  member : [{email: authData.user.email, join_at : Date.now(), out_at : ''}],
                  urlInvite: schedule.urlInvite,
                  created_at: Date.now(),
                  updated_at: Date.now()
                })

                let historyRoom = new Historyroom({
                  user_id : session_room.user_id,
                  meeting_id : session_room.meeting_id,
                  name : session_room.roomname,
                  username : session_room.username,
                  uid : session_room.uid,
                  date : date_time.date(session_room.created_at),
                  start_time : date_time.time(session_room.created_at),
                  end_time : '',
                  setting: session_room.setting,
                  member : [{email: authData.user.email, join_at : Date.now(), out_at : ''}],
                  created_at: session_room.created_at,
                  updated_at: session_room.created_at
                })
                let votes = await Votes.findOne({'host_id': authData.user._id, 'meetingid': ''})
                if (votes) {
                  votes.roomname = session_room.roomname
                  votes.meetingid = session_room.meeting_id
                  await votes.save()
                }
                let del = await Sessionroom.findOne({'uid':schedule.uid})
                if (del) {
                  await del.delete()
                  await session_room.save() 
                  await historyRoom.save() 
                  let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
                  logger.info(`email: ${authData.user.email},message: Start schedule meeting.`)
                  console.log(createUrl);
                  res.send({status:'success',message:`Moderator ${authData.user.email} start schedule meeting`,url:createUrl})
                }else{
                  await session_room.save() 
                  await historyRoom.save() 
                  let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
                  logger.info(`email: ${authData.user.email},message:Moderator start schedule meeting room.`)
                  console.log(createUrl);
                  res.send({status:'success',message:`Moderator ${authData.user.email} start schedule meeting`,url:createUrl})
                }
              }else
                res.status(400).send({status:'error',message:'Wait until the day and time of use.'})
            } else {
              res.status(400).send({status:'error',message: 'No Schedule.'})
            }
          }else
            res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/getschedule',verifyToken,async function(req,res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
          if (sessionuser){
            // let schedule = await Schedulemeeting.find({'user_id':authData.user._id}).sort({created_at: -1})
            let schedule = await Schedulemeeting.aggregate([
              { $match: { 'user_id':authData.user._id }},
              { $sort: { created_at: -1 } },
              // { $project: { date: 1,start_time:1,end_time:1,name:1 } },
            ])
            if (schedule.length) {
              let data = schedule.filter(async (element)=>{
                let date = element.date.split("/")
                day = date[0],
                month = date[1]
                year = date[2]
                let key = code.decode(element.key).split(':')[0]=='123roominet!'? '':code.decode(element.key).split(':')[0]
                const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
                const endtime =  Date.parse(`${day} ${monthNames[month-1]} ${year} ${element.end_time}:00 GMT+0700 (Indochina Time)`);  
                element.key = key
                if (Date.now() <= endtime) {
                  return element
                }else{
                  let check = await Schedulemeeting.findOne({'meeting_id':element.meeting_id},'meeting_id')
                  await check.delete()
                }
              })
              res.send({status:'success',data:data})
            }else
              res.status(400).send({status:'error',message: 'User is has not schedule.'})
          }else
            res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.delete('/deleteschedule',verifyToken,async function(req,res){
  const meetingid= req.body.meetingid
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let del = await Schedulemeeting.findOneAndDelete({'meeting_id':meetingid})
        if (!del) {
          logger.error(`email: ${authData.user.email}, message: Delete Schedulemeeting`)
          res.status(400).json({status:'error',message:'meetingid is wrong.'})
        }else{
          logger.info(`email: ${authData.user.email}, message: Delete Schedulemeeting meetingid ${meetingid}`)
          res.json({status:'success',message:`Delete Schedulemeeting meetingid ${meetingid} Successfully.`})
        }
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.put('/settingroom',verifyToken ,async function(req,res){
  const option1 = req.body.option1,
  option2 = req.body.option2,
  option3 = req.body.option3,
  option4 = req.body.option4,
  option5 = req.body.option5,
  option6 = req.body.option6
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser) {
          let room = await Rooms.findOne({'uid': authData.room.uid})
          let user = await Users.findOne({'_id': authData.user._id})
          if (room && user) {
            room.name = req.body.name
            if (req.body.key == '') {
              room.key = code.encode("123roominet!")
            }else{
              room.key = code.encode(req.body.key+':inet!')
            }
            let setting = settingroom(option1,option2,option3,option4,option5,option6)
            var option = {
              'MuteUserJoin':setting[0],
              'ModeratorApproveBeforeJoin':setting[1],
              'AllowAnyUserStartMeeting':setting[2],
              'AllUserJoinAsModerator':setting[3],
              'SecretRoom':setting[4],
              'OneboxAccountid': req.body.onebox_accountid,
              'Lobby': setting[5]
            };
            room.setting = option
            await room.save()
            jwt.sign({user,room}, process.env.SECRET_TOKEN,{expiresIn: '24h'}, async (err, token)=>{
              if (err) {
                console.log(err);
                res.status(400).send({jwt:err})
              }else{
                let sessionuser = await Sessionuser.findOne({'email': authData.user.email})
                sessionuser.token = token
                await sessionuser.save()
                logger.info(`email: ${authData.user.email},roomuid: ${authData.room.uid}, message: Setting room success`)
                res.send({status:'success',message:'Setting room success',token:token})
              }
            })
          }else
            res.status(400).send({status:'error',message:'No room'})
        }else
        res.status(401).send({status:'error',message:'Token expired'})
      } 
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.get('/history',verifyToken,async function(req,res){
  jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
    if (err) {
      console.log(err);
      res.status(400).send({status:'tokenError',message:err})
    } else {
      // function randomDate(start, end) {
      //   return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      // }
      // let d = randomDate(new Date(2020, 9, 1), new Date()),
      // day = d.getDate() <10 ? '0' + d.getDate() :d.getDate(),
      // month = (d.getMonth()+1 )< 10 ? '0'+ (d.getMonth()+1) : d.getMonth()+1
      // hr = d.getHours()<10 ? '0'+d.getHours():d.getHours(),
      // min = d.getMinutes()<10 ? '0'+d.getMinutes() : d.getMinutes()
      //   let create_his = new Historyroom({
      //     user_id: '5f910b89fe2c8d1c84ccd2a5',
      //     meeting_id: "29c7047198e65c17eaee13e996cb0894-"+ Math.random(),
      //     name: "meet",
      //     username: "ironman4",
      //     date: `${day}/${month}/${d.getFullYear()}`,
      //     end_date: "",
      //     start_time: `${hr}:${min}`,
      //     end_time: "",
      //     attendee: "1",
      //     created_at : d
      //   })
      //   await create_his.save()
      // res.json(create_his)

      let history = await Historyroom.aggregate([
        { $match : { user_id : authData.user._id }},
        { $sort: { created_at: -1 }},
        { $project:{ setting:0,member:0,uid:0,user_id:0,created_at:0,updated_at:0 }},
      ])
      // let history = await Historyroom.find({'user_id': authData.user._id},
      // ["date","end_date","start_time","end_time","name","attendee","file_id","meeting_id"]).sort({created_at: -1})
      if (history.length) {
        res.send({status:'success',history:history})
      }else{
        res.status(400).send({status:'error',message:'User does not have a history of chat rooms.'})
      }
    }
  })
})

router.post('/sharemeeting',verifyToken,async function(req,res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      } else {
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
          if (sessionuser) {
            if(req.body.subject !='' && req.body.email !=''){
              let email =  req.body.email.split(',')
              email.forEach(async element => {
                await sendMail.sharemeeting(req.body.subject,element,authData.room.uid)
              });
              res.send({status:'success',message:'Share link meeting to email successfully.'})
            }else
              res.status(400).send({status:'error',message:'Subject or Email is null.'})
          }else
          res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/checkmeetting',verifyToken,async function(req,res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      } else {
        let sessionuser = await Sessionuser.findOne({'token': req.token, 'email': authData.user.email})
        if (sessionuser) { 
          let session_room = await Sessionroom.findOne({'uid': authData.room.uid})
          if (session_room) {
            let createUrl = `${process.env.domain_conference}${session_room.meeting_id}?${process.env.user_jitsi}?${process.env.password_jitsi}?${session_room.name}?${session_room.option}?${session_room.roomname}?${session_room.user_id}`
            logger.info(`email: ${authData.user.email}, message: Enter the chat room again.`)
            res.send({status:'success',message:`Moderator ${authData.user.email} enter the chat room again`,url:createUrl})
          }else
            res.status(400).send({status:'error',message:'You did not press start the room.'})
        }else
        res.status(401).send({status:'error',message:'Token expired'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/logout',async function(req,res){
  try {
    let session = await Sessionroom.findOne({'meeting_id': req.body.meetingid},['meeting_id','room_id','member','uid','user_id'])
    if (session) {
      if (session.room_id !='') {
        let room = await Rooms.findOne({'_id':session.room_id})
        if(room){
          room.last_session = Date.now()
          await room.save()
        }
      }
      let history = await Historyroom.findOne({'meeting_id':session.meeting_id})
      if (history) {
        history.end_date = date_time.date(Date.now())
        history.end_time = date_time.time(Date.now())
        history.member = session.member
        history.attendee = (session.member).length
        await history.save()
      }
      await Sessionservice.findOneAndDelete({'uid':session.uid})
      await Schedulemeeting.findOneAndDelete({'meeting_id':session.meeting_id})
      logger.info('user_id: '+session.user_id+',meetingid: '+session.meeting_id+' ,message: Endmeeting room session')
      await session.delete()
      res.send({status:'success',message:'room session logout'})
    }else{
      res.status(400).send({status:'error',message:'No room in session'})
    }
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.delete('/attendeelogout',async function(req,res){
  const meeting_id = req.body.meeting_id,user_id = req.body.user_id
  try {
    let user = await Users.findOne({'_id': user_id},'email')
    if (user) {
      let checksession = await Sessionroom.findOne({'meeting_id':meeting_id,'member.email':user.email},'member')
      if (checksession) {
        checksession.member.forEach(element => {
          if (element.email == user.email) {
            element.out_at = Date.now()
          }
        });
        checksession.markModified('member');
        await checksession.save()
        logger.info(`email: ${user.email}, message: attendee logout meeting`)
        res.json({status:'success',message: user.email+' attendee logout meeting'})
      }else
        res.status(400).json({status:'error',message:'meetingid is wrong.'})
    }else
      res.status(400).json({status:'error',message:'userid is wrong.'})
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.put('/setpresenter',async function(req,res){
  let user_id = req.body.user_id,meeting_id = req.body.meeting_id
  try {
    let presenter = await Sessionroom.findOne({'meeting_id':meeting_id},'presenter')
    if (presenter) {
      presenter.presenter = user_id
      await presenter.save()
      res.json({status:'success',message:'set presenter is '+user_id})
    }else
      res.status(400).json({status:'error',message:'meeting_id not available in session'})
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.put('/clearpresenter',async function(req,res){
  let meeting_id = req.body.meeting_id
  try {
    let presenter = await Sessionroom.findOne({'meeting_id':meeting_id},'presenter')
    if (presenter) {
      presenter.presenter = ''
      await presenter.save()
      res.json({status:'success',message:'set presenter is false'})
    }else
      res.status(400).json({status:'error',message:'meeting_id not available in session'})
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.get('/getpresenter/:meetingid',async function(req,res){
  let meeting_id = req.params.meetingid
  try {
    let presenter = await Sessionroom.findOne({'meeting_id':meeting_id},'presenter')
    if (presenter) {
      res.json({status:'success',message:'get presenter from '+meeting_id,data:presenter})
    }else
      res.status(400).json({status:'error',message:'meeting_id not available in session'})
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.get('/getreport/:meetingid',verifyToken,async function(req,res){
  var meeting_id = req.params.meetingid
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        res.send({status:'tokenError',message:err})
      } else {
        let report = await Historyroom.aggregate([
          { $match : { meeting_id : meeting_id ,user_id: authData.user._id}},
          { $project : { setting:0}}
        ])
        if (report.length) {
          let data = {},arr=[],
          startdate = report[0].date.split('/'),enddate = report[0].end_date.split('/')
          start = report[0].start_time.split(':'),
          end =  report[0].end_time.split(':'),
          dt1 = new Date(startdate[2],startdate[1],startdate[0],start[0],start[1]); // 1995, 11, 17, 3, 24, 0
          dt2 = new Date(enddate[2],enddate[1],enddate[0],end[0],end[1]),
          diff =(dt2.getTime() - dt1.getTime()) / 1000;
          diff /= 60;
          let min = Math.abs(Math.round(diff)) //22:00 - 00:00 = 120min
          // console.log( date_time.timeConvert(min));
          report[0].member.forEach((element,index) => {
            let obj = {}
            obj.no = index+1
            obj.name = element.email || element.attendee
            obj.timein = date_time.jointime(element.join_at)
            if (index ==0) {
              obj.timeout = report[0].end_time == '' ? null :report[0].end_time
            }else{
              obj.timeout = element.out_at ==''? null : date_time.jointime(element.out_at)
            }
            // console.log(obj.timeout);
            if (obj.timeout != null) {
              let duration1 = new Date(startdate[2],startdate[1],startdate[0],obj.timein.split(':')[0],obj.timein.split(':')[1])
              let duration2 = new Date(startdate[2],startdate[1],startdate[0],obj.timeout.split(':')[0],obj.timeout.split(':')[1])
              let sum = (duration2.getTime() - duration1.getTime()) / 1000;
              sum /= 60
              let minmember = Math.abs(Math.round(sum))
              obj.duration =  date_time.timeConvert(minmember)
              arr.push(obj)
            }else{
              obj.duration =  null
              arr.push(obj)
            } 
          });
          data.subject = report[0].name
          data.datetime = `${report[0].date}, ${report[0].start_time}-${report[0].end_time == ''? null :report[0].end_time }, Duration ${date_time.timeConvert(min)}`
          data.record = !(report[0].file_id).length? false : true
          data.attendee = report[0].attendee
          data.member = arr
          res.json({status:'success',data:data})
        }else
          res.status(400).json({status:'error',message:'meetingid is wrong.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/getkeyroom',verifyToken,async function(req,res){
  let uid = req.body.uid
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      } else {
        let key = await Rooms.findOne({'uid':authData.room.uid},'key')
        if (key) {
          let password =  code.decode(key.key)
          if (password == '123roominet!') {
            res.json({status:'success',message:'this room has not password.',data:''})
          } else {
            res.json({status:'success',message:'get password room.',data:password.split(':')[0]})
          }
        }else
          res.status(400).json({status:'sucess',message:'uid room error.'})
      }
    })
    
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.get('/downloadreport/:meetingid',verifyToken,async function(req,res){
  var meeting_id = req.params.meetingid
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      } else {
        let report = await Historyroom.aggregate([
          { $match : { meeting_id : meeting_id ,user_id: authData.user._id}},
          { $project : { setting:0}}
        ])
        if (report.length) {
          let data = {},arr=[],
          startdate = report[0].date.split('/'),enddate = report[0].end_date.split('/')
          start = report[0].start_time.split(':'),
          end =  report[0].end_time.split(':'),
          dt1 = new Date(startdate[2],startdate[1],startdate[0],start[0],start[1]); // 1995, 11, 17, 3, 24, 0
          dt2 = new Date(enddate[2],enddate[1],enddate[0],end[0],end[1]),
          diff =(dt2.getTime() - dt1.getTime()) / 1000;
          diff /= 60;
          let min = Math.abs(Math.round(diff)) //22:00 - 00:00 = 120min
          // console.log( date_time.timeConvert(min));
          report[0].member.forEach((element,index) => {
            let obj = {}
            obj.no = index+1
            obj.name = element.email || element.attendee
            obj.timein = date_time.jointime(element.join_at)
            if (index ==0) {
              obj.timeout = report[0].end_time == '' ? null :report[0].end_time
            }else{
              obj.timeout = element.out_at ==''? null : date_time.jointime(element.out_at)
            }
            // console.log(obj.timeout);
            if (obj.timeout != null) {
              let duration1 = new Date(startdate[2],startdate[1],startdate[0],obj.timein.split(':')[0],obj.timein.split(':')[1])
              let duration2 = new Date(startdate[2],startdate[1],startdate[0],obj.timeout.split(':')[0],obj.timeout.split(':')[1])
              let sum = (duration2.getTime() - duration1.getTime()) / 1000;
              sum /= 60
              let minmember = Math.abs(Math.round(sum))
              obj.duration =  date_time.timeConvert(minmember)
              arr.push(obj)
            }else{
              obj.duration =  null
              arr.push(obj)
            } 
          });
          data.subject = report[0].name
          data.datetime = `${report[0].date}, ${report[0].start_time}-${report[0].end_time == ''? null :report[0].end_time }, Duration ${date_time.timeConvert(min)}`
          data.record = !(report[0].file_id).length? false : true
          data.attendee = report[0].attendee
          data.member = arr
          createPDF(data, res, meeting_id)
        }else
        res.status(400).json({status:'error',message:'meetingid is wrong.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/sendinvite',verifyToken,async function(req,res){
  const meeingid = req.body.meetingid,email = req.body.email
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      } else {
        let schedule = await Schedulemeeting.findOne(
          {'user_id':authData.user._id,'meeting_id':meeingid},
          ['date','start_time','end_time','name','urlInvite','meeting_id','key']
        )
        if (schedule) {
          let password = schedule.key === '52b30c17980a0d1230d70088de17d960' ? '' : code.decode(schedule.key).split(":")[0]
          const ics = createICS(
            schedule.date,
            schedule.start_time,
            schedule.end_time,
            schedule.name,
            schedule.urlInvite,
            password
          ),
          emails =  email.split(',')
          emails.forEach(element => {
             sendMail.calendar(element,ics)
             logger.info(`email: ${authData.user.email}, meetingid: ${schedule.meeting_id}, message: Send calendar successfully to ${element}`)
           });
           console.log(ics);

          res.json({status:'success',message:'Send calendar successfully.'})
        }else
          res.status(400).json({status:'error',message:'user or meeting_id is wrong.'})
      }
    })
  }
  catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/updateLobbyAlluser',async function(req,res){
 try {
   let Lobby = Rooms.updateMany({}, {$set: {'setting.Lobby': false}},(err,result)=>{
      if (err) {
        console.log(err);
        res.status(400).json(err)
      }
      console.log(result);
      res.json(result)
    })
 } catch (error) {
   console.log(error);
 }
})

// router.delete('/logout',async function(req,res){
//   try {
//     let session_destroy = await Sessionroom.findOne({'member.user_id': req.body.user_id})
//     if (session_destroy) {
//       if (session_destroy.user_id !== req.body.user_id) {
//         let array = session_destroy.member;
//         let index = array.map(function(e) { return e.user_id; }).indexOf(req.body.user_id);
//         if (index > -1) {
//           array.splice(index, 1)
//           session_destroy.member = array
//           session_destroy.save()
//           res.send({status:'success',message:'user in room logout'})
//         }
//       }else{
//         let last_session = await Rooms.findOne({'_id': session_destroy.room_id}) 
//         last_session.last_session= Date.now()
//         last_session.save()
//         session_destroy.delete()
//         res.send({status:'success',message:'room logout'})
//       }
//     }else{
//       res.send({status:'error',message:'No session'})
//     }
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// })


function settingroom(opt1,opt2,opt3,opt4,opt5,opt6){
  let chkbox1,chkbox2,chkbox3,chkbox4,chkbox5,chkbox6
  if (opt1 == '')
  chkbox1 = false
  else
    chkbox1 = true
  if (opt2 == '') 
    chkbox2 = false
  else
    chkbox2 = true
  if (opt3 == '') 
    chkbox3 = false
  else
    chkbox3 = true 
  if (opt4 == '') 
    chkbox4 = false
  else
    chkbox4 = true
  if (opt5 == '') 
    chkbox5 = false
  else
    chkbox5 = true
  if (opt6 == '') 
    chkbox5 = false
  else
    chkbox6 = true
  return [chkbox1,chkbox2,chkbox3,chkbox4,chkbox5,chkbox6]
}

module.exports = router;