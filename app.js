let express = require('express')
let cookieParser = require('cookie-parser')
let logger = require('morgan')
let cors = require('cors')
let app = express()
let config = require('./config')

app.use(cors({ origin: '*' }))
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By') // чтобы не палить кто сервер
  next()
})
app.use(logger('dev'))
app.use(express.json()) // it is body-parser
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// const authRouter = require('./routes/auth.js')
const mainRouter = require('./routes')
const adminRouter = require('./routes/admin')
// app.use('/*', authRouter)
app.use('/routes', mainRouter)
app.use('/admin', adminRouter)

module.exports = app
