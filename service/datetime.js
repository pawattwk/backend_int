function date (startdate) {
  var today = new Date(startdate)
  var dd = today.getDate()
  var mm = today.getMonth() + 1
  var yyyy = today.getFullYear()
  if (dd < 10)
    dd = '0' + dd
  if (mm < 10)
    mm = '0' + mm
  today = dd + '/' + mm + '/' + yyyy
  return today
}

function dateschedule (reqdate) {
  var today = new Date(reqdate)
  var dd = today.getDate()
  var mm = today.getMonth() + 1
  var yyyy = today.getFullYear()
  if (dd < 10)
    dd = '0' + dd
  if (mm < 10)
    mm = '0' + mm
  today = dd + '/' + mm + '/' + yyyy
  return today
}

function time (starttime) {
  var time = new Date(starttime)
  var hour = time.getHours()
  var min = time.getMinutes()
  if (hour < 10)
    hour = '0' + hour
  if (min < 10)
    min = '0' + min
  time = hour + ':' + min
  return time
}

function nextdatetime () {
  let tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)),
    day = tomorrow.getDate(),
    month = tomorrow.getMonth()+1,
    hour = tomorrow.getHours(),
    min = tomorrow.getMinutes(),
    sec = tomorrow.getSeconds()
    datestring = ( day <10 ?'0' + (day) : day) + '-' + ( month<10 ? '0' + (month):month) + '-' +
    tomorrow.getFullYear() + ' ' + ( hour<10 ? '0' + hour:hour) + ':' + (min<10 ? '0' + min :min) +
    ':' + (sec <10 ?'0' + sec :sec)
  return datestring
}

function datetimeformat () {
  var d = new Date(),
    day = d.getDate(),month = d.getMonth() + 1,year = d.getFullYear(),
    hour = d.getHours(),min = d.getMinutes(),sec = d.getSeconds()
  var datestring = (day <= 9 ? '0' + day : day) + '-' + (month <= 9 ? '0' + month : month) + '-' + year +
  'T' + (hour <= 9 ? '0' + hour : hour) + '-' + (min <= 9 ? '0' + min : min) +
  '-' + (sec <= 9 ? '0' + sec : sec)
  return datestring
}

function sessiontimeout () {
  let tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)),
    month = '' + (tomorrow.getMonth() + 1),
    day = '' + (tomorrow.getDate()),
    year = tomorrow.getFullYear(),
    hour = '' + (tomorrow.getHours()),
    min = '' + (tomorrow.getMinutes())
  return `${min} ${hour} ${day} ${month} *`
}

function addminutes (date, time, duration) {
  let datesplit = date.split('-'),timesplit = time.split(':'),
    olddate = new Date(datesplit[0], datesplit[1], datesplit[2], timesplit[0], timesplit[1]),
    min = new Date(olddate.getTime() + duration * 60000),
    hh = min.getHours(),mm = min.getMinutes()
  if (hh < 10)
    hh = '0' + hh
  if (mm < 10) {
    mm = '0' + mm
  }
  return hh + ':' + mm
}

function jointime (joinat) {
  var day = new Date(joinat)
  var hr = day.getHours()
  var min = day.getMinutes()
  if (hr < 10) hr = '0' + hr
  if (min < 10) min = '0' + min
  time = hr + ':' + min
  return time
}

function timeConvert (n) {
  var num = n
  var hours = (num / 60)
  var rhours = Math.floor(hours)
  var minutes = (hours - rhours) * 60
  var rminutes = Math.round(minutes)
  if (rhours == '0') {
    return rminutes + ' Min'
  }
  else if (isNaN(n)) {
    return null
  }
  else
    return rhours + ' Hr ' + rminutes + ' Min'
}
// let d = new Date(Date.now()).toLocaleString(); //แสดงวันที่และเวลา 2018-5-31 16:30:00

function nextmonth(date){
  let dateformatt = new Date(date)
  let nextmonth = new Date(dateformatt.setDate(dateformatt.getDate() + 30)),
  month = (nextmonth.getMonth() + 1),
  day = (nextmonth.getDate()),
  year = nextmonth.getFullYear(),
  hour = (nextmonth.getHours()),
  min = (nextmonth.getMinutes())
  return `${min} ${hour} ${day} ${month} *`
}

function expiretoken(expdate,check){
  let date = new Date(0),
  exp =  date.setUTCSeconds(expdate),
  exdateForm = new Date(exp),
  month = (exdateForm.getMonth() + 1),
  day = (exdateForm.getDate()),
  year = exdateForm.getFullYear(),
  hour = (exdateForm.getHours()),
  min = (exdateForm.getMinutes()),
  sec = (exdateForm.getSeconds())
  if (check === '')
    // 23-10-2020 16:54:14
    return `${day}-${month}-${year} ${hour}:${min}:${sec}`
  else
    return `${min} ${hour} ${day} ${month} *`

}

function hourUTC(time){
  let addhours = new Date(time.setHours(time.getHours() - 7))
  month = (addhours.getMonth() + 1),
  day = (addhours.getDate()),
  year = addhours.getFullYear(),
  hour = (addhours.getHours()),
  min = (addhours.getMinutes())
  if (hour < 10) hour = '0' + hour
  if (min < 10) min = '0' + min
  //20201029T103000Z
  return `${year}${month}${day}T${hour}${min}00Z`
}

function durationICS(diff){
  let num = diff,
  hours = (num / 60),
  rhours = Math.floor(hours),
  minutes = (hours - rhours) * 60,
  rminutes = Math.round(minutes)
  return { hours: rhours, minutes: rminutes }
}

module.exports = {
date,time,nextdatetime,sessiontimeout,addminutes,
datetimeformat,dateschedule,jointime,timeConvert,
nextmonth,expiretoken,hourUTC,durationICS
}
