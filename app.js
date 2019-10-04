let express = require('express')
let cookieParser = require('cookie-parser')
let logger = require('morgan')
let cors = require('cors')
let passport = require('passport')
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

const authRouter = require('./routes/auth.js')
const mainRouter = require('./routes')
const adminRouter = require('./routes/admin')
app.use('/login', authRouter)
app.use('/routes', mainRouter)
app.use('/admin', adminRouter)

module.exports = app
