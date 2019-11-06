let express = require('express')
let cookieParser = require('cookie-parser')
let logger = require('morgan')
let cors = require('cors')
let passport = require('passport')
let config = require('./config')
const jwt = require('jsonwebtoken')
const db = require('./helpers/db')
let app = express()
require('./helpers/passport')

app.use(passport.initialize())
passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  done(null, user)
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

app.use(async function (req, res, next) {
  let body = req.body ? JSON.stringify(req.body) : ''
  let params = req.body ? JSON.stringify(req.params) : ''
  let headers = req.body ? JSON.stringify(req.headers) : ''
  let r
  try {
    if (req.headers.authorization && req.headers.authorization.split(' ')[1]) {
      let jwtSecret = await config.jwtSecret
      r = await jwt.verify(req.headers.authorization.split(' ')[1], jwtSecret)
      db.q(`insert into logs_request_admin (post_params, get_params, headers, user, url ) values (?,?,?,?,?)`, [body, params, headers, r.user, req.originalUrl])
    }
    next()
  } catch (err) {
    if (r) console.log(r.user)
    console.warn('не могу добавить запись в лог реквестов', err)
    next()
  }
});

const authRouter = require('./routes/auth.js')
const mainRouter = require('./routes')
const adminRouter = require('./routes/admin')
app.use('/login', authRouter)
app.use('/routes', mainRouter)
app.use('/admin', adminRouter)

module.exports = app
