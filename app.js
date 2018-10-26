var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var app = express();
var config = require('./config');

var firebase_admin = require('firebase-admin');
var serviceAccount = require('./alertnotification-a0fd6-firebase-adminsdk-qbv0s-7e9fcb94aa.json');

firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(serviceAccount),
    databaseURL: 'https://alertnotification-a0fd6.firebaseio.com'
});

app.use(cors({origin: '*'}));
app.use((req, res, next) => {
    res.removeHeader("X-Powered-By"); // чтобы не палить кто сервер
    next();
});
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
require('./routes/auth')(app, config, router);
require('./routes/getusers')(app, config, firebase_admin, router);
require('./routes/groups')(app, config, firebase_admin, router);
require('./routes/incident')(app, config, firebase_admin, router);
require('./routes/users')(app, config, firebase_admin, router);
require('./routes/tags')(app, config, router);
require('./routes/file')(app, config, router);
require('./routes/info')(app, config, router);
require('./routes/calendars')(app, config, router);

app.use(router);
module.exports = app;
