// main.js
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const createPDF = require('./calendarICS')


function confirm_email (email, name, lastname) {
  try {
    const emailToken = jwt.sign({email: email}, process.env.SECRET_TOKEN, {expiresIn: '24h'})
    let transporter = ''
    if (process.env.NODE_ENV == 'development') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.gmail_user, // your email
          pass: process.env.gmail_password // your email password
        }
      })
    }else{
      transporter = nodemailer.createTransport({
        host: process.env.gatewayinet,
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      })
    }
    // // config gmail
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.gmail_user, // your email
    //     pass: process.env.gmail_password // your email password
    //   }
    // })
    // // config outlook
    // const transporter = nodemailer.createTransport({
    //   service: 'hotmail',
    //   auth: {
    //     user: 'yourmail@hotmail.com', // your email
    //     pass: 'password' // your email password
    //   }
    // })

    let mailOptions = {}
    if (process.env.NODE_ENV == 'development') {
      // setup email data with unicode symbols
      mailOptions = {
        from: '"oneconference@inet.co.th" <oneconference@inet.co.th>',
        to: email, // list of receivers
        subject: 'Check your account verification.', // Mail subject
        html: `<b>Hello ${name} ${lastname}</b><br>` + '<b>Your recently visited our sign up page using an email which has already been registered and activated.</b><br>' +
          '<b>Click the active below to sign in.</b><br><br><br>' +
          `<a href="${process.env.DOMAIN}/api/users/verifyemail/${emailToken}" class="btn btn-primary">Active</a><br>` +
          '<br><br><b>Thank you,</b><br><b>One conference team</b>' // HTML body
      }
    }else {
      mailOptions = {
        from: '"oneconference@inet.co.th" <oneconference@inet.co.th>',
        to: email, // list of receivers
        subject: 'Check your account verification.', // Mail subject
        html: `<b>Hello ${name} ${lastname}</b><br>` + '<b>Your recently visited our sign up page using an email which has already been registered and activated.</b><br>' +
          '<b>Click the active below to sign in.</b><br><br><br>' +
          `<a href="${process.env.DOMAIN}/backend/api/users/verifyemail/${emailToken}" class="btn btn-primary">Active</a><br>` +
          '<br><br><b>Thank you,</b><br><b>One Conference</b>' // HTML body
      }
    }

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (err, info) {
      if (err)
        console.log(err)
      else
        console.log(info)
    })
  } catch (error) {
    console.log(error)
  }
}

function recoveryPassword (email) {
  try {
    const emailToken = jwt.sign({email: email}, process.env.SECRET_TOKEN, {expiresIn: '10m'})
    let transporter = ''
    if (process.env.NODE_ENV == 'development') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.gmail_user, // your email
          pass: process.env.gmail_password // your email password
        }
      })
    }else{
      transporter = nodemailer.createTransport({
        host: process.env.gatewayinet,
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      })
    }

    const mailOptions = {
        from: '"oneconference@inet.co.th" <oneconference@inet.co.th>',
        to: email, // list of receivers
        subject: 'Recovery your password.', // Mail subject
        html: 
          '<b>Click the link below to recoverypassword.</b><br><br><br>' +
          `<a href="${process.env.domain_frontend}/recoverypassword/${emailToken}" class="btn btn-primary">Recovery</a><br>` +
          '<br><br><b>Thank you,</b><br><b>One Conference</b>' // HTML body
    }
    transporter.sendMail(mailOptions, function (err, info) {
      if (err)
        console.log(err)
      else
        console.log(info)
    })
  } catch (error) {
    console.log(error)
  }
}

function sharemeeting (subject,email,uid) {
  try {
    let transporter = ''
    if (process.env.NODE_ENV == 'development') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.gmail_user, // your email
          pass: process.env.gmail_password // your email password
        }
      })
    }else{
      transporter = nodemailer.createTransport({
        host: process.env.gatewayinet,
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      })
    }
    const mailOptions = {
        from: '"oneconference@inet.co.th" <oneconference@inet.co.th>',
        // from: 'oneconference.inet.co.th', // sender
        to: email, // list of receivers
        subject: 'Join to conference', // Mail subject
        html: 
          '<b>Click the link below to join meeting Oneconference.</b><br><br><br>' +
          `<b>Meeting Subject: ${subject}</b><br>` +
          `<a href="${process.env.domain_frontend}/join/?uuid=${uid}" class="btn btn-primary">${process.env.domain_frontend}/join/?uuid=${uid}</a><br>` +
          '<br><br><b>Thank you,</b><br><b>One Conference</b>' // HTML body
    }
    transporter.sendMail(mailOptions, function (err, info) {
      if (err)
        console.log(err)
      else
        console.log(info)
    })
  } catch (error) {
    console.log(error)
  }
}

function calendar(email,ics){
  // let content = inviteCalendar(data)
  // let content = 'BEGIN:VCALENDAR\n' +
  //       'METHOD:PUBLISH\n'+
  //       'VERSION:2.0\n' +
  //       'BEGIN:VEVENT\n' +
  //       'UID:1805f7b696cb6817\n'+
  //       `SUMMARY:${data.SUMMARY}\n` +
  //       `DTSTAMP:${data.DTSTAMP}\n`+
  //       `DTSTART:${data.DTSTART}\n` +
  //       `DTEND:${data.DTEND}\n` +
  //       `LOCATION:${data.LOCATION} \n` +
  //       `DESCRIPTION: ${data.DESCRIPTION}\n` +
  //       'END:VEVENT\n' +
  //       'END:VCALENDAR';
  //       console.log(content);

  try {
    let transporter = ''
    if (process.env.NODE_ENV == 'development') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.gmail_user, // your email
          pass: process.env.gmail_password // your email password
        }
      })
    }else{
      transporter = nodemailer.createTransport({
        host: process.env.gatewayinet,
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      })
    }
    const mailOptions = {
      from: '"oneconference@inet.co.th" <oneconference@inet.co.th>',
      // from: 'oneconference.inet.co.th', // sender
      to: email, // list of receivers
      subject: 'Calendar oneconference', // Mail subject
      html: 
        '<b>Click the link below to set calendar meeting oneconference.</b><br><br><br>',
      // attachments : [content],
      icalEvent: {
        filename: 'invitation.ics',
        method: 'request',
        content: ics 
      }
      // icalEvent: {
      //   method: 'PUBLISH',
      //   path: '../invitation.ics'
      // }
    }
    transporter.sendMail(mailOptions, function (err, info) {
      if (err)
        console.log(err)
      else
        console.log(info)
    })
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
confirm_email,recoveryPassword,sharemeeting,calendar
}
