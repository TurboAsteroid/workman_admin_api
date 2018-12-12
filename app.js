var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var cors = require('cors')
var app = express()
var config = require('./config')

var firebaseAdmin = require('firebase-admin')
var serviceAccount = require('./alertnotification-a0fd6-firebase-adminsdk-qbv0s-7e9fcb94aa.json')

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://alertnotification-a0fd6.firebaseio.com'
})

app.use(cors({ origin: '*' }))
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By') // чтобы не палить кто сервер
  next()
})
app.use(logger('dev'))
app.use(express.json()) // it is body-parser
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.set('AD_config', {
  url: config.ldapurl,
  baseDN: config.ldapbaseDN,
  username: config.username,
  password: config.password
})
let ActiveDirectory = require('activedirectory2')
let ad = new ActiveDirectory(app.get('AD_config'))
app.set('AD', ad)

require('./schedule/notification')(app, config, firebaseAdmin)

let router = express.Router()
require('./routes/auth')(app, config, router)
require('./routes/getusers')(app, config, firebaseAdmin, router)
require('./routes/groups')(app, config, firebaseAdmin, router)
require('./routes/incident')(app, config, firebaseAdmin, router)
require('./routes/users')(app, config, firebaseAdmin, router)
require('./routes/tags')(app, config, router)
require('./routes/file')(app, config, router)
require('./routes/info')(app, config, router)
require('./routes/calendars')(app, config, router)
require('./routes/report')(app, config, router)

app.use(router)
module.exports = app
