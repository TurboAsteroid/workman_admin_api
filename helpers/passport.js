const config = require('../config')
const passport = require('passport')
const passportJWT = require('passport-jwt')

const ExtractJWT = passportJWT.ExtractJwt
const LocalStrategy = require('passport-local').Strategy
const JWTStrategy = passportJWT.Strategy
const db = require('./db')
const helper = require('./helper')

async function pass () {
  passport.use(new LocalStrategy({
    usernameField: 'user',
    passwordField: 'pass'
  },
  async function (user, password, cb) {
    try {
      const [userSQL] = await db.q(`select * from users where user = ? and admin = 1 limit 1;`, [user])
      if (userSQL[0] && userSQL[0].salt && userSQL[0].password === helper.sha512(password, userSQL[0].salt)) {
        return cb(null, { user: user, token: helper.sha512(helper.genRandomString(100)) }, {
          message: 'Logged In Successfully'
        })
      } else {
        return cb(null, false, { message: 'Incorrect user or password.' })
      }
    } catch (err) {
      console.warn(err)
      return cb(err)
    }
  }
  ))

  async function getJWT () {
    try {
      let jwtSecret = await config.jwtSecret
      return jwtSecret
    } catch (err) {
      console.log('не могу получить secret key', err)
      return false
    }
  }
  let jwtSecret = await getJWT()

  passport.use(new JWTStrategy({
    // jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    jwtFromRequest: ExtractJWT.fromExtractors([ExtractJWT.fromAuthHeaderAsBearerToken(), ExtractJWT.fromUrlQueryParameter('token')]),
    secretOrKey: jwtSecret
  },
  async function (jwtPayload, next) {
    try {
      const userSQL = (await db.q(`select user from users where adminToken = ? limit 1;`, [jwtPayload.token]))[0]
      if (userSQL.length < 1) {
        return next(null, false, { message: 'Incorrect token.' })
      }
      return next(null, userSQL)
    } catch (err) {
      return next(err)
    }
  }
  ))
}
pass()
