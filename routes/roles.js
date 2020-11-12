var express = require('express');
var router = express.Router();
var roles = require('../models/roles');

router.post('/create',async function(req, res) {
  try {
    let data = new roles({
      name: req.body.name,
      created_at : Date.now(),
      updated_at : Date.now(),
    })
    await data.save()
    res.send({status:'success',message:'create role success',data:data})
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

module.exports = router;