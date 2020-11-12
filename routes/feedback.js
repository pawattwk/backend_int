var express = require('express');
var router = express.Router();
var feedback = require('../models/feedback');

router.post('/', async function (req, res) {
  try {
    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let datetime = date + "-" + month + "-" + year + " " + hours + ":" + minutes;

    let data = new feedback({
      score: req.body.score,
      message: req.body.message,
      room: req.body.room,
      created_at: datetime,
    })
    await data.save()
    res.send({ status: 'success', message: 'create role success', data: data })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.get('/data', async function (req, res) {
  try {
    let data = await feedback.find()
    let ReverseData = data.reverse()

    if (data == '') {
      res.send({ status: 'success', message: 'create role success', data: "NoData" })
    } else {
      res.send({ status: 'success', message: 'create role success', data: ReverseData })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/Search', async function (req, res) {
  try {
    let data = await feedback.find({ room: req.body.room })
    if (data == '') {
      res.send({ status: 'success', message: 'search success', data: "No Room" })
    } else {
      res.send({ status: 'success', message: 'success', data: data })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/Rating', async function (req, res) {
  try {
    let average = 0
    let count = 0
    let data = await feedback.find()
    for (let i = 0; i < data.length; i++) {
      if (data[i]['score'] != -1) {
        count = count + 1
        average = average + data[i]['score']
      }
    }
    average = ((average) / count).toFixed(1);

    res.send({ status: 'success', message: 'create role success', average: average })
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/NoScore', async function (req, res) {
  try {
    let data = await feedback.find({ score: "-1" })

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

router.post('/OneScore', async function (req, res) {
  try {
    let data = await feedback.find({ score: "1" })

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

router.post('/TwoScore', async function (req, res) {
  try {
    let data = await feedback.find({ score: "2" })

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

router.post('/ThreeScore', async function (req, res) {
  try {
    let data = await feedback.find({ score: "3" })

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

router.post('/FourScore', async function (req, res) {
  try {
    let data = await feedback.find({ score: "4" })

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

router.post('/FiveScore', async function (req, res) {
  try {
    let data = await feedback.find({ score: "5" })

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

module.exports = router;
