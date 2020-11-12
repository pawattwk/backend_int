const axios = require('axios')
const users = require('../models/users')
const rooms = require('../models/rooms')

async function Oneid(username,password,name,lastname,mobile_no){
  try {
    data = {
      "username": username,
      "password": password,
      "first_name_eng": name,
      "last_name_eng": lastname,
      "mobile_no": mobile_no,
      "ref_code": process.env.ONEID_REF_CODE,
      "clientId":process.env.ONEID_CLIENT_ID,
      "secretKey":process.env.ONEID_CLIENT_SECRET,
    }

    let register = await axios.post(process.env.ONEID_API_REGISTER,data) //registerOneid
    if (register) {
      return register.data
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports ={
  Oneid
}