var express = require('express');
var router = express.Router();
// var users = require('../models/users');

router.get('/',async function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
