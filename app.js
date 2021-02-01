var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
//connect_database
require('./service/connect_DB')
var cors = require('cors')


//routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
const roomsRouter = require('./routes/rooms');
const feedbacksRouter = require('./routes/feedback');
const upload_photoRouter = require('./routes/upload_photo');
const loginRouter = require('./service/authentication');
const synconeid = require('./routes/synconeid')
const votes_mg = require('./routes/votes')
const votes = require('./routes/votes_jitsi')
// const onechatroom = require('./routes/OnechatRoom')
const intregateService = require('./routes/intregateService')
const onebox = require('./routes/onebox')
const otp = require('./routes/OTP')
const genclientIdRouter = require('./routes/gen_clientId')
const onemailRouter = require('./service/sync_services')
const socketRouter = require('./routes/socket')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json()); // middlewares
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, './public')));
app.get('/image/profile/:user_id',async function(req, res) {
  let img = req.params.user_id
  res.sendFile(path.join(__dirname, "./assets/profile/" + img));
})

if (process.env.NODE_ENV == 'development') {
  //use api route
  app.use('/', indexRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/roles', rolesRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/api/auth', loginRouter);
  app.use('/api/feedback', feedbacksRouter);
  app.use('/api/avatar', upload_photoRouter);
  app.use('/api/votes' , votes)
  app.use('/api/votes_manage' , votes_mg)
  app.use('/api/onechatroom' , intregateService)
  app.use('/api/synconeid' , synconeid)
  app.use('/api/onebox' , onebox)
  app.use('/api/otp' , otp)
}else{
  //use api route
  app.use('/backend/api/users', usersRouter);
  app.use('/backend/api/roles', rolesRouter);
  app.use('/backend/api/rooms', roomsRouter);
  app.use('/backend/api/auth', loginRouter);
  app.use('/backend/api/feedback', feedbacksRouter);
  app.use('/backend/api/avatar', upload_photoRouter);
  app.use('/backend/api/votes' , votes)
  app.use('/backend/api/votes_manage' , votes_mg)
  app.use('/api/onechatroom' , intregateService)
  app.use('/api/socket', socketRouter)
  app.use('/backend/api/synconeid' , synconeid)
  app.use('/backend/api/onebox' , onebox)
  app.use('/backend/api/otp' , otp)
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
})
module.exports = app;
