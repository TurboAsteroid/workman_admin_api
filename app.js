var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var app = express();
var config = require('./config');
var firebase_admin = require('firebase-admin');
var serviceAccount = require('./alertnotification-a0fd6-firebase-adminsdk-qbv0s-d25f46c201.json');
firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(serviceAccount),
    databaseURL: 'https://alertnotification-a0fd6.firebaseio.com/'
});

app.use(cors({origin: '*'}));


app.set('mysql_config', {
    user:  config.dbUser,
    password: config.dbPassword,
    host: config.dbHost,
    database: config.dbDatabase,
});

app.set('AD_config', {
    url: config.ldapurl,
    baseDN: config.ldapbaseDN,
    username: config.username,
    password: config.password
});
var ActiveDirectory = require('activedirectory2');
var ad = new ActiveDirectory(app.get('AD_config'));
app.set('AD', ad);

// var mssql_connect = mssql.connect(mssql_config);

var getUsersRouter = require('./routes/getusers')(app, config, firebase_admin);
var indexRouter = require('./routes/index')(app, config, firebase_admin);
var groups = require('./routes/groups')(app, config, firebase_admin);
var incedents = require('./routes/incedent')(app, config, firebase_admin);
var notification = require('./schedule/notification')(app, config, firebase_admin);
var users = require('./routes/users')(app, config, firebase_admin);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter );
app.use('/getusers', getUsersRouter );
app.use('/groups', groups );
app.use('/incedent', incedents );
app.use('/users', users );

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
