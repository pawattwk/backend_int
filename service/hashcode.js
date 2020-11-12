const crypto = require('crypto');

function encode(data){
  let logic = crypto.createCipher('aes-128-cbc', process.env.SECRET_TOKEN);
  let encode = logic.update(data, 'utf8', 'hex')
  encode += logic.final('hex');
  return encode
}

function decode(data){
  let logic = crypto.createDecipher('aes-128-cbc', process.env.SECRET_TOKEN);
  let decode = logic.update(data, 'hex', 'utf8')
  decode += logic.final('utf8');
  return decode
}

function decodeToken(token,secretkey){
  let logic = crypto.createDecipher('aes-128-cbc', secretkey);
  let decode = logic.update(token, 'hex', 'utf8')
  decode += logic.final('utf8');
  return decode
}


module.exports ={
  encode,decode,decodeToken
}