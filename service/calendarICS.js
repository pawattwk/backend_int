const ics = require('ics')
const {durationICS} =  require('./datetime')
const sendMail = require('../service/sendemail')

function inviteCalendar(data){
  const event = {
    start: data.datetime,
    duration: data.duration,
    title: data.title,
    description: data.description,
    location: data.location,
    // url: 'http://www.bolderboulder.com/',
    // geo: { lat: 40.0095, lon: 105.2669 },
    // categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    // organizer: { name: 'Admin', email: 'Race@BolderBOULDER.com' },
    // attendees: [
    //   { name: 'Adam Gibbons', email: 'mufc_hinza@homtail.co.th', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
      // { name: 'Brittany Seaton', email: 'brittany@example2.org', dir: 'https://linkedin.com/in/brittanyseaton', role: 'OPT-PARTICIPANT' }
    // ]
  }
  
  let create =  ics.createEvent(event, (error, value) => {
    if (error) {
      console.log(error)
      return
    }
    // console.log(value)
    return value
  })
  return create
}

function createICS(date,starttime,endtime,title,description,password){
  const dateformat = date.split("/"),
  starttimeform = starttime.split(":"),
  endtimeform = endtime.split(":"),
  day =  parseInt(dateformat[0]),
  month = parseInt(dateformat[1]),
  year = parseInt(dateformat[2]),
  hour = parseInt(starttimeform[0]),
  min = parseInt(starttimeform[1]),
  dt1 = new Date(dateformat[2],dateformat[1],dateformat[0],starttimeform[0],starttimeform[1]), // 1995, 11, 17, 3, 24, 0
  dt2 = new Date(dateformat[2],dateformat[1],dateformat[0],endtimeform[0],endtimeform[1])
  let diff =(dt2.getTime() - dt1.getTime()) / 1000
  diff /= 60,
  diffMin = Math.abs(Math.round(diff)), //22:00 - 00:00 = 120min
  keyroom = password === '' ? '' : 'password: '+password
  const data = {
    datetime: [year,month,day,hour,min],
    duration: durationICS(diffMin), // { hours: 1, minutes: 30 }
    title: title,
    description: description+'\n'+ keyroom,
    location: 'นัดประชุมผ่าน OneConference'
  },
  calendar = inviteCalendar(data)
  return calendar
}


module.exports ={
  createICS
}


