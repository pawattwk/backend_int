if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
'use strict';
const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
const { type } = require('os');

const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const filename = path.join(logDir, date()+'.log');

var datenow = new Date(Date.now());
var today = datenow.getDate() //use
var nextDay = new Date(today);
nextDay.setDate(datenow.getDate() + 1);
var tomorrow = nextDay.getDate() //use
var next24 = localStorage.getItem("nextDay"); //use
// console.log(today,tomorrow,next24);

function date(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; 
  var yyyy = today.getFullYear();
  if(dd<10)
    dd='0'+dd;
  if(mm<10)
    mm='0'+mm;
  today = dd+'-'+mm+'-'+yyyy;
  return today
}


function info(message){
  const logger = createLogger({
    // change level if in dev environment versus production
    level: env === 'development' || 'production' ? 'debug' : 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.printf(info => `{"datetime":"${info.timestamp}","level":"${info.level}","message":"${info.message}"}`)
    ),
    transports: [
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize(),
          format.printf(
            info => `${info.timestamp}: ${info.level}: ${info.message}`
          )
        )
      }),
      new transports.File({ filename }),
      new transports.File({ filename: 'log/main.log' }),    
    ]
  });

  if (!next24) {
    localStorage.setItem("nextDay", tomorrow);
    logger.info(message);
  }
  else{
    if ( parseInt(today) === parseInt(next24)) {
      fs.truncate('log/main.log', 0, function(){console.log('clear file')})
      logger.info(message);
      localStorage.removeItem("nextDay");
    }else if(parseInt(today) > parseInt(next24)){
      localStorage.removeItem("nextDay");
      localStorage.setItem("nextDay", tomorrow);
      fs.truncate('log/main.log', 0, function(){console.log('clear file')})
      logger.info(message);
    }else{
      logger.info(message);
    }
  }
}

function warn(message){
  const logger = createLogger({
    // change level if in dev environment versus production
    level: env === 'development' || 'production' ? 'debug' : 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.printf(info => `{"datetime":"${info.timestamp}","level":"${info.level}","message":"${info.message}"}`)
    ),
    transports: [
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize(),
          format.printf(
            info => `${info.timestamp}: ${info.level}: ${info.message}`
          )
        )
      }),
      new transports.File({ filename }),
      new transports.File({ filename: 'log/main.log' }),
    ]
  });

  if (!next24) {
    localStorage.setItem("nextDay", tomorrow);
    logger.warn(message);
  }
  else{
    if ( parseInt(today) === parseInt(next24)) {
      fs.truncate('log/main.log', 0, function(){console.log('clear file')})
      logger.warn(message);
      localStorage.removeItem("nextDay");
    }else if(parseInt(today) > parseInt(next24)){
      localStorage.removeItem("nextDay");
      localStorage.setItem("nextDay", tomorrow);
      fs.truncate('log/main.log', 0, function(){console.log('clear file')})
      logger.warn(message);
    }else{
      logger.warn(message);
    }
  }
}

function error(message){
  
  const logger = createLogger({
    // change level if in dev environment versus production
    level: env === 'development' || 'production' ? 'debug' : 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.printf(info => `{"datetime":"${info.timestamp}","level":"${info.level}","message":"${info.message}"}`)
    ),
    transports: [
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize(),
          format.printf(
            info => `${info.timestamp}: ${info.level}: ${info.message}`
          )
        )
      }),
      new transports.File({ filename }),
      new transports.File({ filename: 'log/main.log' }),
    ]
  });
  if (!next24) {
    localStorage.setItem("nextDay", tomorrow);
    logger.error(message);
  }
  else{
    if ( parseInt(today) === parseInt(next24)) {
      fs.truncate('log/main.log', 0, function(){console.log('clear file')})
      logger.error(message);
      localStorage.removeItem("nextDay");
    }else if(parseInt(today) > parseInt(next24)){
      localStorage.removeItem("nextDay");
      localStorage.setItem("nextDay", tomorrow);
      fs.truncate('log/main.log', 0, function(){console.log('clear file')})
      logger.error(message);
    }else{
      logger.error(message);
    }
  }
}

module.exports = {
   info,warn,error
};