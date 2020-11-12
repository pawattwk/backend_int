var express = require('express');
var router = express.Router();
var votes = require('../models/votes');

router.get('/data', async function (req, res) {
  try {
    let data = await votes.find()
    res.send({ status: 'success', message: 'Data data', data: data })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/search', async function (req, res) {
  try {
    let data = await votes.find({ meetingid: req.body.meetingid })
    if (data == '') {
      res.send({ status: 'success', message: 'create role success', data: "NoData" })
    } else {
      res.send({ status: 'success', message: 'create role success', data: data })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/addpoll', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    const body = req.body
    let data = await votes.findOne({ meetingid: body.meetingid })
    if (data === null) {
      let newdata = new votes({
        meetingid: body.meetingid,
        host_id: body.meetingid,
        PollList: body.data
      })
      await newdata.save()
      res.status(200).send({
        status: 'Success',
        data: dataformat
      })
    } else {
      data.PollList.push(body.data)
      data.markModified('PollList')
      await data.save()
      res.status(200).send({
        status: 'Success',
        data: dataformat
      })
    }
  } catch (error) {
    console.log(error);
    res.status(200).send({
      status: 'Success',
      data: []
    })
  }
})

router.get('/:host_id', async function (req, res) {
  try {
    let data = await votes.findOne({ 'host_id': req.params.host_id })
    console.log(data);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.send(data)
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

router.post('/getpollList', async function (req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    const body = req.body
    console.log('meeting ID ____>>', body.meetingid)
    let data = await votes.findOne({ meetingid: body.meetingid })
    let dataformat = data.PollList.filter(e => !e.user_votes.includes(body.userid))
    res.status(200).send({
      status: 'Success',
      data: dataformat
    })
  } catch (error) {
    console.log(error);
    res.status(200).send({
      status: 'Success',
      data: []
    })
  }
})

router.post('/saveanswer', async function (req, res) {
  try {
    const body = req.body
    const answer = req.body.answer
    let data = await votes.findOne({ meetingid: body.meetingid })
    console.log(body)
    for (const [i, element] of answer.entries()) {
      for (const [index, e] of data.PollList.entries()) {
        if (e.pollid == element.pollid && element.choice !== -1) {
          data.PollList[index].user_votes.push(body.userid)
          data.PollList[index].choice[element.choice].user_answer.push(body.userid)
        }
      }
    }
    data.markModified('PollList')
    console.log(data.PollList[0])
    await data.save()
    res.status(200).send({
      status: 'Success',
    })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

module.exports = router;