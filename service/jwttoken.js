const jwt = require('jsonwebtoken')

// function encode({

// })

function DecodeExpTime(token){
  const decode =  jwt.verify(token , process.env.SECRET_TOKEN,  (err, authData)=>{
      if (err) {
        console.log(err)
        return err
      }else{
        return authData.exp
      }
    })
    return decode
  }

module.exports = {
  DecodeExpTime
}