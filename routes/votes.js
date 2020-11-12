var express = require('express');
var router = express.Router();
var votes = require('../models/votes');
const { json } = require('express');
const verifyToken = require('../service/verifyToken')
const jwt = require('jsonwebtoken')  
const Sessionroom = require('../models/session_room');
const logger = require('../service/loggerfile');

// router.post('/create',async function(req, res) {
//   try {
//     let data = new votes({
//       content : req.body.content,
//       details : req.body.details,
//       choice :  req.body.choice,
//       meetingid : req.body.meetingid || null,
//       host_id: req.body.host_id
//     })
//     await data.save()
//     res.status(200).send({
//       status: 'Success',
//       data: data
//     })
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// })

// router.get('/:host_id',async function(req, res) {
//   try {
//     let data =  await votes.findOne({'host_id': req.params.host_id}) 
//     console.log(data);
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
//     res.setHeader('Access-Control-Allow-Credentials', true); 
//     res.send(data)

//     // res.status(200).send({
//     //   status: 'Success',
//     //   data: JSON.stringify(data)
//     // })
//   } catch (error) {
//     console.log(error);
//     res.send(error)
//   }
// })

router.put('/update',verifyToken,async function(req, res) {
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let data = await votes.findOne({'host_id': authData.user._id ,'meetingid': ''})
        if (data) {
          data.topic = req.body.topic
          data.PollList = req.body.pollist
          data.questions = (req.body.pollist).length
          await data.save()
          res.send({status:'Success',message:'Update polls Successfully.',data:data})
        }else
          res.status(400).send({status:'Error',message:'Please craete your poll.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.post('/insertpoll',verifyToken,async function(req, res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let checkpoll = await votes.findOne({'host_id':authData.user._id, 'meetingid':''})
        if (checkpoll) {
          res.send({status:'Error',message:'Poll has already been created.'})
        }else{
          let createpolls = new votes({
            host_id : authData.user._id,
            topic : req.body.topic,
            PollList : req.body.pollist,
            questions : (req.body.pollist).length
          })
          await createpolls.save()
          logger.info(`email: ${authData.user.email}, message: Create poll successfully.`)
          res.send({status:'Success',message:'Create polls successfully.'})
        }
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.get('/polls',verifyToken,async function(req, res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let poll = await votes.find({'host_id': authData.user._id}).sort({created_at: -1})
        if (poll.length) {
          res.send({status:'Success',message:'Get polls Successfully.',polls:poll})
        }else
          res.send({status:'Error',message:'User has not polls.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.delete('/polls',verifyToken,async function(req, res){
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let poll = await votes.findOne({'host_id': authData.user._id,'meetingid': ''})
        if (poll) {
          await poll.delete()
          res.send({status:'Success',message:'Delete polls Successfully.'})
        }else
          res.send({status:'Error',message:'User has not polls.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})
module.exports = router;