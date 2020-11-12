var express = require('express');
var router = express.Router();
const logger = require('../service/loggerfile');
const jwt = require('jsonwebtoken')  
const verifyToken = require('../service/verifyToken')
const fs = require('fs')
const path = require('path');
const axios = require('axios')
const Onebox = require('../models/onebox')
const Users = require('../models/users')
const Historyroom = require('../models/history_rooms')
const Sessionroom = require('../models/session_room')
const Oneboxfile = require('../models/oneboxfiles')
const onebox = require('../service/onebox')
const mongoose = require("mongoose");
const { throws } = require('assert');
const ObjectId = mongoose.Types.ObjectId;
const date_time = require('../service/datetime');



router.get('/download/:file_id',verifyToken,async function(req,res){
  let file_id = req.params.file_id
  try {
    jwt.verify(req.token, process.env.SECRET_TOKEN, async (err, authData)=>{
      if (err) {
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      } else {
        let checkfile_user = await Oneboxfile.findOne({'file_id':file_id,'user_id':authData.user._id },'file_id')
        if (checkfile_user) {
          const header = {headers: {Authorization: process.env.ONEBOX_AUTH}}
          await axios.request({
            url: process.env.ONEBOX_DONWLOAD+'?file_id='+file_id,
            method: 'get',
            headers: {
              'Authorization':process.env.ONEBOX_AUTH,
              'Accept-Encoding':'gzip, deflate, br'
            },
            responseType: 'arraybuffer',
          }).then((response) => {
              var json = response.data
              var filename = 'record.mp4';
              var mimetype = 'application/mp4';
              res.setHeader('Content-Type', mimetype);
              res.setHeader('Content-disposition','attachment; filename='+filename);
              res.send( json );
            })
          .catch(function (err) {
            console.error(err);
          });
        }else
          res.status(400).json({status:'error',message:'The file does not exist in this account.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.get('/saveonebox/:meetingid',async function(req,res){
  let meetingid = req.params.meetingid
  try {
    let chkmeeting = await Sessionroom.findOne({'meeting_id':meetingid},['user_id','setting.OneboxAccountid','meeting_id'])
    if (chkmeeting) {
      let user = await Users.findOne({'_id':chkmeeting.user_id},'email')
      let history_file_id = await Historyroom.findOne({'meeting_id':meetingid},'file_id')
      let getfolder =  await Onebox.findOne({'account_id': chkmeeting.setting.OneboxAccountid},['mainfolder','account_id']) 
      if (getfolder) {  
        const pathdirect = process.env.path_record
        let findfile = path.resolve(pathdirect)
        fs.readdir(findfile,async function(err, filenames) {
          if (err) {
            console.log(err)
          }
          var checkfile =  filenames.some(function (value, index, _arr) {
            return value === meetingid+".mp4";
          });
          if (checkfile) {
            let directoryPath ='',filename =`record-${date_time.datetimeformat()}.mp4`
            fs.rename(findfile+'/'+meetingid+".mp4", findfile+'/'+filename, (err) => { 
              if (err) console.log(err);
              console.log(`rename: ${findfile}=>${filename}`); 
            })
            directoryPath = path.resolve(pathdirect+filename)
            let createfolder = await onebox.createfolder(getfolder.account_id,getfolder.mainfolder,'Record_Oneconference')
            if (createfolder.status === 'OK') {
              let savefile = await onebox.savefileonebox(directoryPath,getfolder.account_id,createfolder.data.folder_id)
              if (savefile.message === 'insert data success') {
                let oneboxfile = new Oneboxfile({
                  filename : savefile.data.filename,
                  file_id : savefile.data.id,
                  user_id : chkmeeting.user_id,
                  size :  bytesToSize(savefile.data.size_file),
                  meetingid: chkmeeting.meeting_id
                })
                history_file_id.file_id.push(savefile.data.id)
                await history_file_id.save()
                await oneboxfile.save()
                await onebox.getstorage(getfolder.account_id) //save storage onebox
                logger.info(`email: ${user.email}, message: save file record ${filename} to Onebox Successfully.`)
                await fs.unlink(directoryPath, function (err) {
                  if (err) throw err;
                  // if no error, file has been deleted successfully
                  console.log('File deleted!');
                  logger.info(`email: ${user.email}, message: delete file record ${filename} in server Successfully.`)
                  res.json(savefile)
                }); 
              }else{
                logger.error(`email: ${user.email}, message: Can't save file record ${filename}.`)
                await movefile(filename,chkmeeting.user_id,user.email,meetingid)
                res.json({status:'error',message:"Can't save file."}) 
              }
            } 
          } else 
              res.status(400).json({status:'error',message:"This meetingid has not file record."})
        })
      }
    }else{
      res.status(400).json({status:'error',message:'Meetingid is wrong.'})
    }

  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})

router.post('/getoneboxbusiness',verifyToken,async function(req,res){
  try {
    jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let bussiness = await Onebox.aggregate([
          // { $match : {'account_name':{$ne: 'ผู้ใช้ทั่วไป'}}},
          { $lookup:{
                from: "Users",
                localField: "oneid",
                foreignField : "oneid",
                as: "user_result"
            }
          },
          { $match : { user_result : {$elemMatch : {'_id': ObjectId(authData.user._id) }} }},
          { $project:{ account_id:1,account_name:1 }},
        ])
        if (bussiness.length) {
          let data =  bussiness.filter((value)=>{
            if (bussiness.length > 1) {
              if (value.account_name != 'ผู้ใช้ทั่วไป') {
                return value
              }
            }else
              return value
          })
          res.json({status:"success",data:data})
        } else
          res.status(400).json({status:"error",message:"userid is wrong!"})    
      }
    })
    // let user = await Users.findOne({'_id': req.body.userid},'oneid')
    // if (user) {
    //   bussiness = await Onebox.find({'oneid': user.oneid,'account_name':{$ne: 'ผู้ใช้ทั่วไป'}},['account_id','account_name']) 
    //   res.json({status:"success",data:bussiness})
    // }else
    //   res.status(400).json({status:"error",message:"userid is wrong!"})
  } catch (error) {
    console.log(error)
    res.status(403).send(error)
  }
})

router.get('/getoneboxfile/:meetingid',verifyToken,async function(req,res){
  const meeting_id=req.params.meetingid
  try {
    jwt.verify(req.token , process.env.SECRET_TOKEN, async (err, authData)=>{
      if(err){
        console.log(err);
        res.status(400).send({status:'tokenError',message:err})
      }else{
        let getfile = await Oneboxfile.find({'user_id': authData.user._id,'meetingid':meeting_id},['filename','file_id','size'])
        .sort({'created_at':1})
        if (getfile.length) {
          res.json({status:'success', data:getfile})
        }else
          res.status(400).json({status:'error',message:'The file does not exist in this meetingid.'})
      }
    })
  } catch (error) {
    console.log(error);
    res.status(403).send(error)
  }
})


// router.post('/test',async function(req,res){
//   let one = await onebox.getstorage('06aa9e0912d24deb515660eaeb48d3cb')
//   res.send(one)
// })


function movefile(filename,user_id,email,meetingid){
  let pathdirect = process.env.path_record,
  backuprecord = process.env.path_backuprecord,
  findfile = path.resolve(backuprecord),
  currentPath = path.resolve(pathdirect+'/'+filename)
  newPath = ''
  fs.readdir(findfile,async function(err, filenames) {
    if (err) {
      console.log(err)
    }
    else{
      let getfile = filenames.some(function (value, index, _arr) {
        return value === user_id
      })
      if (getfile) {
        findfile = path.resolve(backuprecord+'/'+user_id),
        fs.readdir(findfile,async function(err, filenames) {
          if (err) {
            console.log(err)
          }
          else{
            let getname = filenames.filter(function (value, index, _arr) {
              let checkmeetid = value.includes(meetingid),arr=[]
              if (checkmeetid) {
                arr.push(value)
                return arr
              }
            });
            if (getname.length) {
              let checkfile = getname.map(function (value, index, _arr) {
                if (index == getname.length-1) {
                  let meet = value.split(".");
                  let num = meet[0].split('-');
                  let count = parseInt(num[2])
                  if(count < 9) 
                    newPath = path.resolve(`${backuprecord}/${user_id}/${meetingid}-0${count+1}.mp4`)
                  else
                    newPath = path.resolve(`${backuprecord}/${user_id}/${meetingid}-${count+1}.mp4`)
                  return newPath
                }
              })
              newPath = checkfile[getname.length-1]
            }else
              newPath = path.join(`${backuprecord}/${user_id}/${meetingid}-01.mp4`)
            
              fs.rename(currentPath, newPath, (err) => { 
                  if (err) console.log(err);
                  console.log('Move file to: '+newPath); 
                  logger.info(`email: ${email}, message: Move record file to ${newPath}.`)
              })
            }
        })
      }
      else{
        newPath = path.resolve(backuprecord+'/'+user_id)
        fs.mkdir(newPath,(err)=>{ //new folder
          if (err) console.log(err);
          else{
            newPath = path.resolve(backuprecord+'/'+user_id, meetingid+'-01.mp4') //move file
            fs.rename(currentPath, newPath, (err) => { 
              if (err) console.log(err);
              console.log('Move file to: '+newPath); 
              logger.info(`email: ${email}, message: Move record file to ${newPath}.`)
            })
          }
        }); 
      } 
 
    }
  })
}

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024, i)).toFixed( 2 ) + ' ' + sizes[i];
}

// function movefile(meetingid){
//   let pathdirect = process.env.path_record
//   let findfile = path.join(__dirname,process.env.path_backuprecord);
//   let currentPath = path.join(__dirname, `${pathdirect}${meetingid}.mp4`)
//   let newPath = ''   
//   fs.readdir(findfile,async function(err, filenames) {
//     if (err) {
//       console.log(err)
//     }
//     else{
//       let getfile = filenames.filter(function (value, index, _arr) {
//         let checkmeetid = value.includes(meetingid),arr=[]
//         if (checkmeetid) {
//           console.log(value);
//           arr.push(value)
//           return arr
//         }
//       });
//       if (getfile.length) {
//         let checkfile = getfile.map(function (value, index, _arr) {
//           if (index == getfile.length-1) {
//             let meet = value.split(".");
//             let num = meet[0].split('-');
//             let count = parseInt(num[2])
//             console.log(count);
//             if(count < 9) 
//               newPath = path.join(__dirname, process.env.path_backuprecord, `${meetingid}-0${count+1}.mp4`)
//             else
//               newPath = path.join(__dirname, process.env.path_backuprecord, `${meetingid}-${count+1}.mp4`)
//             return newPath
//           }
//         })
//         newPath = checkfile[getfile.length-1]
//       }else
//         newPath = path.join(__dirname, '../../jibri/recordings/unsave/', `${meetingid}-01.mp4`)
//       try {
//         fs.renameSync(currentPath, newPath)
//         console.log("Successfully moved the file!")
//       } catch(err) {
//         throw err
//       }
//     }
//   })
// }
   
module.exports = router;
