var express = require('express');
var router = express.Router()
const OTP = require('../models/OTP')
const axios = require('axios')

router.post('/sendotp/:oneid',async function(req, res , next) {
    let oneid = req.params.oneid
    let OTP_sms = Math.floor(Math.random() * 899999) + 100000
    let header = {headers: { Authorization: `Bearer ${process.env.tokenbotonecon}` }}
    if(req.headers.authorization.split(' ')[1] == process.env.SECRET_TOKEN){
      try {
        console.log(oneid)
        let session = await OTP.findOne({ oneid : oneid})
        if(session !== null){
          session.OTP = OTP_sms
          session.conter_OTP = 0
          session.updated_at = Date.now()
          await session.save()
        }else{
          let new_session = new OTP({
            oneid : oneid,
            OTP : OTP_sms
          }) 
          await new_session.save()
        }
        axios.post( process.env.ONECHAT_OTP_API , {
            "to" : oneid,
            "bot_id" : process.env.bot_id,
            "type" : "text",
            "message" : `OTP: ${OTP_sms}`,
            "custom_notification" : `OTP: ${OTP_sms}`
          },header)
          res.status(200).send({
            status : 'Success'
          })
      } catch (error) {
        console.log('Catch >> ' , error)
      }
    }else{
      res.status(200).send({
        massage: 'Authorization is Wrong'
      })
    }
})

router.post('/checkotp/:oneid/:OTP',async function(req, res , next) {
  try {
    let oneid = req.params.oneid
    let OTP_sms = req.params.OTP
    let session = await OTP.findOne({ oneid : oneid})
    if(req.headers.authorization.split(' ')[1] == process.env.SECRET_TOKEN){
      if(session.OTP === OTP_sms && session.conter_OTP <= 2){
        let timeup = calculatetime(new Date(Date.now()) , session.updated_at)
        if(timeup){
          res.status(200).send({
            result : false,
            status : 'Success',
            message : 'OTP is timeup'
          })
        }else{
          // await OTP.deleteOne({ oneid : oneid})
          session.delete()
          res.status(200).send({
            result : true,
            status : 'Success',
            message : 'OTP is true'
          })
        }
      }else if(session.conter_OTP > 2){
        res.status(200).send({
          result : false,
          status : 'Exceed',
          message : 'OTP of Exeed'
        })
      }else{
        session.conter_OTP = session.conter_OTP + 1
        await session.save()
        res.status(200).send({
          result : false,
          status : 'Wrong',
          message : 'OTP is wrong'
        })
      }
    }else{
      res.status(200).send({
        result : false,
        massage: 'Authorization is Wrong'
      })
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

function calculatetime(end,start) {

  let difference = end.getTime() - start.getTime();
  let daysDifference = Math.floor(difference/1000/60/60/24);
  difference -= daysDifference*1000*60*60*24
  let hoursDifference = Math.floor(difference/1000/60/60);
  difference -= hoursDifference*1000*60*60
  let minutesDifference = Math.floor(difference/1000/60);
  difference -= minutesDifference*1000*60
  let secondsDifference = Math.floor(difference/1000);
  
  if(hoursDifference < 10){
    hoursDifference = hoursDifference.toString().padStart(2, '0')
  }
  if(minutesDifference < 10){
    minutesDifference = minutesDifference.toString().padStart(2, '0')
  }
  if(secondsDifference < 10){
    secondsDifference = secondsDifference.toString().padStart(2, '0')
  }
  // let result = hoursDifference + ':' + minutesDifference + ':' + secondsDifference
  if(hoursDifference > 0 || (minutesDifference > 5 && secondsDifference > 0) ){
    return true
  }else{
    return false
  }
  
}


module.exports = router;