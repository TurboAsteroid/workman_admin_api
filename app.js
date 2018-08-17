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
app.use(logger('dev'));
app.use(express.json()); // it is body-parser
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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

var notification = require('./schedule/notification')(app, config, firebase_admin);

let router = express.Router();
var auth = require('./routes/auth')(app, config, router);
var getUsersRouter = require('./routes/getusers')(app, config, firebase_admin, router);
var groups = require('./routes/groups')(app, config, firebase_admin, router);
var incedents = require('./routes/incedent')(app, config, firebase_admin, router);
var users = require('./routes/users')(app, config, firebase_admin, router);
var tags = require('./routes/tags')(app, config, router);
router.use(auth);
router.use(getUsersRouter);
router.use(groups);
router.use(incedents);
router.use(users);
router.use(tags);

app.use(router);

// app.use(express.static(path.join(__dirname, 'public')));
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
//
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
