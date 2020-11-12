var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken') 
const Microservice = require('../models/microservice')

router.get('/',async function(req,res){
  const secret_key = crypto.randomBytes(32).toString('hex')
  jwt.sign({owner:'oneconference',service:'onemail'}, secret_key, async (err, token)=>{
    if(err){
      console.log(err);
    }else{
      var logic = crypto.createCipher('aes-128-cbc', secret_key);
      var encode = logic.update(token, 'utf8', 'hex')
      encode += logic.final('hex');
      let saveclientid = new Microservice({
        client_name: 'onemail',
        client_id: encode,
        secret_key: secret_key
      })
      await saveclientid.save()
      res.send(saveclientid)
    }
  })
})

router.get('/test',async function(req,res){
  const clientid = req.body.client_id
  var logic = crypto.createDecipher('aes-128-cbc', 'secret_key');
  var decode = logic.update(clientid, 'hex', 'utf8')
  decode += logic.final('utf8');
  jwt.verify(decode, 'secret_key', async (err, Data)=>{
    if(err){
      console.log(err);
    }else{
      console.log(Data);
    }
  })
})

module.exports = router;