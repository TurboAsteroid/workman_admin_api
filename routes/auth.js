const config = require('../config')
const ActiveDirectory = require('ad-promise')
const jwt = require('jsonwebtoken')
const express = require('express')
const router = express.Router()

let ad = new ActiveDirectory(config.adConfig)

router.all('*', async function (req, res, next) {
  if (
    req.originalUrl === '/login'
  ) next()
  else if (
    (req.headers.authorization !== undefined && req.headers.authorization !== null) ||
    (req.query.jwt !== undefined && req.query.jwt !== null)
  ) {
    try {
      let token = ''
      if (req.query.jwt !== undefined && req.query.jwt !== null) {
        token = req.query.jwt
      } else {
        token = req.headers.authorization.replace(/Bearer /g, '')
      }

      const decoded = jwt.verify(token, cfg.jwtSecret)

      let authResult = await ad.authenticate(decoded.login, decoded.password)
      if (authResult) {
        console.log(`${decoded.login} Authenticated!`)
        next()
      } else {
        console.log(`${req.body.user} Authenticated failed!`)
        return res.json({"status": 'ERROR', "message": "Authenticated failed!"})
      }
    } catch (err) {
      return res.json({"status": 'ERROR', "message": err})
    }
  } else {
    res.status(403).send('Access denied')
  }
})

router.post('/auth/login', async (req, res) => {
  let authResult = await ad.authenticate(req.body.user.login, req.body.user.password)
  if (!authResult) {
    console.log(`${req.body.user} Authenticated failed!`)
    return res.json({"status": 'ERROR', "message": "Authenticated failed!"});
  }

  console.log(`${req.body.user.login} Authenticated!`)
  let token = await jwt.sign({ login: req.body.user.login, password: req.body.user.password },
    cfg.jwtSecret, { expiresIn: '24h'})
  return res.json({"status": 'OK', "data": { auth: true, token: token, user: { name: req.body.user.login, isAdmin: 1 } }});
})

module.exports = router