const config = require('../config')

const express = require('express')
const router = express.Router()
const db = require('../helpers/db')
const jwt = require('jsonwebtoken')
const passport = require('passport')

/* POST login. */
router.post('/', function (req, res, next) {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: info ? info.message : 'Login failed',
        user: user
      })
    }
    req.login(user, { session: false }, async (err) => {
      if (err) {
        res.send(err)
      }
      // генерим токен и толкаем его в дата
      const data = jwt.sign(JSON.stringify(user), config.jwtSecret)
      const status = 'TOKEN'
      try {
        await db.q(`update users SET adminToken = ? where user = ?`, [ user.token, user.user ])
      } catch (err) {
        console.warn('Не могу записать токен firebase в базу')
      }

      return res.json({ status, data })
    })
  })(req, res)
})

module.exports = router
