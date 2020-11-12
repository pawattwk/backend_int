var express = require('express');
var router = express.Router();
const sha1 = require('sha1')
var roomonechat = require('../models/session_roomonechat')
var roomManageai = require('../models/session_roomManageAi')
// var roomonecon = require('../models/session_room')
const auth = require('../service/auth_onechat')
// const sercretkey = 'ONECHATSERVICE'
// a[0].conference.oe.authEnabled
router.post('/create',async function(req, res , next) {
  let data = req.body
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1] 
    if(auth(tokenkey)){ 
      let meetingid = sha1(data.roomname) + '-' + Date.now()
      let tagService = data.tag 
      let key = sha1(meetingid + data.name)
      let url = process.env.ONECHAT_ROOM_DOMAIN + meetingid + '?test?test?' + data.name + '?' + data.option + '?' + data.roomname + '?'
      if (tagService == null || tagService == 'onechat') {
        tagService = 'onechat'
        url = url + tagService
        let session = new roomonechat({
            hostname : data.name,
            roomname : data.roomname,
            urlroom : url,
            keyroom : key,
            member : [{name : data.name , join_at : timeNow(), out_at : ''}],
            meeting_id : meetingid,
            created_at : Date.now(),
        })
        await session.save()
      } else if (tagService == 'ManageAi') {
        tagService = 'ManageAi'
        url = url + tagService
        let session = new roomManageai({
            hostname : data.name,
            roomname : data.roomname,
            urlroom : url,
            keyroom : key,
            member : [{name : data.name , join_at : timeNow(), out_at : ''}],
            meeting_id : meetingid,
            created_at : Date.now(),
        })
        await session.save()
      }
      res.status(200).send({
        data:{
          urlroom : url,
          meetingid : meetingid,
          key: key,
          option: data.option,
          created_at: timeNow()},
        events: 'CreateRoom',
        status: 'Success'
      })
    }else{
      res.send({
        status : 'AuthError',
        error :  'SecretKey-Wrong' 
      })
    } 
  } catch (error) {
    console.log(error)
    next(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
  
})

router.post('/join',async function(req, res , next) {
  try {
    const tokenkey = req.headers['authorization'].split(' ')[1] 
    if(auth(tokenkey)){ 
      let data = req.body
      let tagService = data.tag
      let roomdata
      let arrJoin
      let url = process.env.ONECHAT_ROOM_DOMAIN + data.meetingid + '?attendee?' + data.name + '?' + data.key + '?' + data.option
      if (tagService == null || tagService == 'onechat') {
        roomdata = await roomonechat.findOne({ meeting_id: data.meetingid})
        // console.log(roomdata)
        url = url + '?' + roomdata.roomname + '?onechat'
        if(roomdata.keyroom !== data.key){
          res.send({status:'ERROR' , error: 'WrongKey'})
        }
        let joindata = updateJoinTime(roomdata.member, data.name)
        if (joindata.statusJoin) {
          await roomonechat.updateOne({ meeting_id: data.meetingid }, { member: joindata.arrMember })
        } else {
          arrJoin = joindata.arrMember
          arrJoin.push({ name: data.name , join_at: timeNow(), out_at : ''})
          await roomonechat.updateOne({ meeting_id: data.meetingid}, { member: arrJoin })
        }
      } else if (tagService == 'ManageAi') {
        roomdata = await roomManageai.findOne({ meeting_id: data.meetingid})
        // console.log(roomdata)
        url = url + '?' + roomdata.roomname + '?ManageAi'
        if(roomdata.keyroom !== data.key){
          res.send({status:'ERROR' , error: 'WrongKey'})
        }
        let joindata = updateJoinTime(roomdata.member, data.name)
        if (joindata.statusJoin) {
          await roomManageai.updateOne({ meeting_id: data.meetingid}, { member: joindata.arrMember })
        } else {
          arrJoin = joindata.arrMember
          arrJoin.push({ name: data.name , join_at: timeNow(), out_at : ''})
          await roomManageai.updateOne({ meeting_id: data.meetingid}, { member: arrJoin })
        }
      }
      
      res.status(200).send({
        data:{
          urlroom : url,
          name_join: data.name,
          meetingid : data.meetingid,
          join_at: timeNow(),
          option : data.option
        },
      events: 'JoinRoom',
      status: 'Success'
     })
    }else{
      res.send({
        status : 'AuthError',
        error :  'SecretKey-Wrong' 
      })
    } 
  }catch (error) {
    console.log(error)
    next(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
})

router.post('/checkKey' , async function(req , res) {
  try {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods','POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers','Content-Type, Option, Authorization')
    
    let meetingid = req.body.meetingid
    let roomdata
    let nameJoin = req.body.name
    if (req.body.clientname == 'oneconference' || req.body.clientname == 'onemail') {
      roomdata = await roomonecon.findOne({ meeting_id: meetingid })
      res.send({key: roomdata.key , urlInvite: roomdata.urlInvite})
    } else if(req.body.clientname == 'onechat'){
       roomdata = await roomonechat.findOne({ meeting_id: meetingid })
       let joindata = updateJoinTime(roomdata.member, nameJoin)
       await roomonechat.updateOne({ meeting_id: meetingid }, { member: joindata.arrMember })
       res.send({key: roomdata.keyroom })
    } else if (req.body.clientname == 'ManageAi') {
      roomdata = await roomManageai.findOne({ meeting_id: meetingid })
      let joindata = updateJoinTime(roomdata.member, nameJoin)
      await roomManageai.updateOne({ meeting_id: meetingid }, { member: joindata.arrMember })
      res.send({key: roomdata.keyroom })
    }
    
  } catch (error) {
    console.log(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
})

router.post('/endmeeting',async function(req, res , next) {
  try {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods','POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers','Content-Type, Option, Authorization')

    let meetingid = req.body.meetingid
    let roomdata
    let arrJoin
    if (req.body.clientname == 'oneconference' || req.body.clientname == 'onemail') {
        roomdata = await roomonecon.findOne({ meeting_id: meetingid })
        arrJoin = roomdata.member
        arrJoin.forEach(e => {
          e.out_at = timeNow()
        });
        await roomonecon.updateOne({ meeting_id: meetingid}, roomdata)
    } else if(req.body.clientname == 'onechat'){
        roomdata = await roomonechat.findOne({ meeting_id: meetingid })
        arrJoin = roomdata.member
        arrJoin.forEach(e => {
          e.out_at = timeNow()
        });
        await roomonechat.updateOne({ meeting_id: meetingid}, roomdata)
    } else if (req.body.clientname == 'ManageAi') {
        roomdata = await roomManageai.findOne({ meeting_id: meetingid})
        arrJoin = roomdata.member
        arrJoin.forEach(e => {
          e.out_at = timeNow()
        });
        await roomManageai.updateOne({ meeting_id: meetingid}, roomdata)
    }
    res.status(200).send({
      events : 'EndMeeting',
      status : 'Success'
    })
  } catch (error) {
    console.log(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
})

router.post('/endjoin',async function(req, res , next) {
  try {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods','POST, GET, PUT, PATCH, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers','Content-Type, Option, Authorization')

    let meetingid = req.body.meetingid
    let namejoin = req.body.name
    let roomdata
    if (req.body.clientname == 'oneconference' || req.body.clientname == 'onemail') {
        roomdata = await roomonecon.findOne({ meeting_id: meetingid })
        let enddata = updateEndJoin(roomdata.member, namejoin)
        await roomonecon.updateOne({ meeting_id: meetingid}, { member: enddata })
    } else if(req.body.clientname == 'onechat'){
        roomdata = await roomonechat.findOne({ meeting_id: meetingid })
        let enddata = updateEndJoin(roomdata.member, namejoin)
        await roomonechat.updateOne({ meeting_id: meetingid }, { member: enddata })
    } else if (req.body.clientname == 'ManageAi') {
        roomdata = await roomManageai.findOne({ meeting_id: meetingid})
        let enddata = updateEndJoin(roomdata.member, namejoin)
        await roomManageai.updateOne({ meeting_id: meetingid }, { member: enddata })
    }
    res.status(200).send({
      events : 'EndJoin',
      status : 'Success'
    })
  } catch (error) {
    console.log(error)
    res.send({
      status : 'Error',
      error : error 
    })
  }
})

function updateJoinTime(arrMember, namejoin, statusJoin=false) {
  arrMember.forEach(e => {
    if (e.name == namejoin) {
      statusJoin = true
      e.join_at = timeNow()
    }
  });
  return {
    arrMember,
    statusJoin
  }
}

function updateEndJoin(arrMember, namejoin) {
  arrMember.forEach(e => {
    if (e.name == namejoin) {
      e.out_at = timeNow()
    }
  });
  return arrMember
}

function timeNow() {
  let now = new Date();
  let resultTime = now.toLocaleString();

  return resultTime
}
module.exports = router;
