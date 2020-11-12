const axios = require('axios')
const Users = require('../models/users')


async function resetPassword(username){
  const data = {
    "username": username,
    "secretkey": process.env.ONEID_CLIENT_SECRET,
    "refcode":  process.env.ONEID_REF_CODE,
    "client_id": process.env.ONEID_CLIENT_ID
  }
  let getEmail = await axios.post(process.env.ONEID_API_GET_EMAIL_BY_USERNAME, data);
  let email = getEmail.data
  if (email.result === 'Success') {
    let user = await Users.findOne({'username': username})
    if (user) {
      const email = {
        "username": username,
        "secretkey": process.env.ONEID_CLIENT_SECRET,
        "refcode":  process.env.ONEID_REF_CODE,
        "client_id": process.env.ONEID_CLIENT_ID,
        "email": user.email
      }
      let resetpwd = await axios.post(process.env.ONEID_API_RESET_PASSWORD, email);
        return resetpwd.data
      }
  } 
  
}

module.exports = {
  resetPassword
}