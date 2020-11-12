const axios = require('axios')
const Users = require('../models/users')
const Rooms = require('../models/rooms')
const Roles = require('../models/roles')
const Onebox = require('../models/onebox')
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function getonebox(accesstoken,oneid){
  let user = await Users.findOne({'oneid':oneid},['email','_id','role','license'])
  let checkonebox = await Onebox.find({'oneid': oneid},['account_name','account_id'])
  let room = await Rooms.findOne({'user_id':user._id},'setting')
  if (!checkonebox.length) {
    const header = {headers: {Authorization: process.env.ONEBOX_AUTH}}
    const oneidToken ={ accesstoken : accesstoken }
    let getAccountOnebox = await axios.post(process.env.ONEBOX_GETACCOUNT, oneidToken, header)
    if (getAccountOnebox) {
      let dataonebox = getAccountOnebox.data.result
        dataonebox.forEach(async value => {
          if (value.account_name ==='ผู้ใช้ทั่วไป') {
            let setting =  { 
              MuteUserJoin: false,
              ModeratorApproveBeforeJoin: false,
              AllowAnyUserStartMeeting: false,
              AllUserJoinAsModerator: false,
              SecretRoom: false,
              OneboxAccountid: value.account_id,
              Lobby: false
            }
            room.setting = setting
            await room.save()
          }
          let createonebox = new Onebox({
            oneid : oneid,
            account_id : value.account_id,
            account_name : (value.account_name).replace('บริษัทจำกัด','').replace('บริษัทมหาชนจำกัด',''),
            branch_no : value.branch_no,
            email : value.email || user.email,
            taxid : value.taxid,
            mainfolder : '',
            storage : '',
            usage_storage : '',
            remain_storage : '',
          })
          const account_ID = { account_id: value.account_id}
          let getMainfolder = await axios.post(process.env.ONEBOX_GETMAINFOLDER, account_ID, header)
          let getStorage = await axios.post(process.env.ONEBOX_GETSTORAGE, account_ID, header)
          if (getMainfolder) {
            let mainfolder = getMainfolder.data.result
            mainfolder.forEach(element => {
              if (element.folder_name == 'Private Main Folder') {
                createonebox.mainfolder = element.folder_id
              }
            });
          }
          if (getStorage) {
            let getstorage = getStorage.data.result
            createonebox.storage = getstorage[0].storage
            createonebox.used_storage = getstorage[0].used_storage
            createonebox.remain_storage = getstorage[0].remain_storage
          }
          await createonebox.save()
        }) 
        if (dataonebox.length > 1) {
          for (const key in dataonebox) {
            if (dataonebox.hasOwnProperty(key)) {
              const element = dataonebox[key];
              if ((element.account_name).includes('บริษัทมหาชนจำกัดอินเทอร์เน็ตประเทศไทย') || (element.account_name).includes('แมนดาลา')) {
                let role = await Roles.findOne({'name':'host'},'_id')
                user.role = role._id
                await user.save()
              }else{
                let role = await Roles.findOne({'name':'citizen'},'_id')
                user.role = role._id
                user.license = Date.now()
                await user.save()
              }
            }
          }
        }else{
          let role = await Roles.findOne({'name':'citizen'},'_id')
          user.role = role._id
          user.license = Date.now()
          await user.save()
        }
      }   
  }else{
    checkonebox.forEach(async value => {
      if (value.account_name ==='ผู้ใช้ทั่วไป') {
        let setting =  { 
          MuteUserJoin: false,
          ModeratorApproveBeforeJoin: false,
          AllowAnyUserStartMeeting: false,
          AllUserJoinAsModerator: false,
          SecretRoom: false,
          OneboxAccountid: value.account_id ,
          Lobby: false
        }
        room.setting = setting
        await room.save()
      }
    })
  }
}

async function savefileonebox(file,account_id,folder_id){
  let bodyFormData = new FormData();
  try {
  bodyFormData.append('account_id', account_id)
  bodyFormData.append('folder_id' , folder_id)
  bodyFormData.append('file' , fs.createReadStream(path.resolve(file)))
  // let header_formdata = { headers: {'Content-Type': `multipart/form-data; boundary=${bodyFormData._boundary}` , Authorization: `Bearer ${process.env.ONEBOX_AUTH}`} }
  // let save_onebox = await axios.post(process.env.ONEBOX_SAVEFILE, bodyFormData, header_formdata)
  let header_formdata = {'Content-Type': `multipart/form-data; boundary=${bodyFormData._boundary}` , Authorization: `Bearer ${process.env.ONEBOX_AUTH}`}
  let save_onebox =  await axios({
    method: 'post',
    url: process.env.ONEBOX_SAVEFILE,
    data: bodyFormData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: header_formdata
})
  return save_onebox.data
  } catch (error) {
    console.log(error);
  }
}

async function createfolder(account_id,folder_id,foldername){
  try {
    const header = {headers: {Authorization: process.env.ONEBOX_AUTH}},
    body = {
      account_id: account_id,
      parent_folder_id: folder_id,
      folder_name: foldername
    }
    let useronebox = await Onebox.findOne({'account_id':account_id},'recordfolder')
    if (useronebox) {
      let createfolder = await axios.post(process.env.ONEBOX_CREATEFOLDER,body,header)
      useronebox.recordfolder = createfolder.data.data.folder_id
      await useronebox.save()
      return createfolder.data
    }
  } catch (error) {
    console.log(error);
  }
}

async function getstorage(account_id){
  const header = {headers: {Authorization: process.env.ONEBOX_AUTH}}
  const account_ID = { account_id: account_id}
  let getStorage = await axios.post(process.env.ONEBOX_GETSTORAGE, account_ID, header)
  if (getStorage) {
    console.log(getStorage.data.result[0].remain_storage);
    let useronebox = await Onebox.findOne({'account_id':account_id},['storage','used_storage','remain_storage'])
    useronebox.storage = getStorage.data.result[0].storage
    useronebox.used_storage = getStorage.data.result[0].used_storage
    useronebox.remain_storage = getStorage.data.result[0].remain_storage
    await useronebox.save()
  }
}

async function getLimitMeeting(email){
  let user = await Users.findOne({'email':email},['role','license'])
  let role = await Roles.findOne({'_id': user.role},['name','_id'])
  if (role.name === 'citizen') {
    user.role = role._id
    return user.role
  }else if(role.name === 'host'){
    user.role = role._id
    return user.role
  }else if(role.name === 'admin'){
    user.role = role._id
    return user.role
  }else{
    user.role = role._id
    return user.role
  }
  // user.license = Date.now()
}
module.exports = {getonebox,savefileonebox,createfolder,getstorage,getLimitMeeting}