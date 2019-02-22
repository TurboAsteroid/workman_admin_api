const express = require('express')
const router = express.Router()

router.get('/', async function (req, res, next) {
  res.json({ status: 'OK', data: [{ name: 'a' }, { name: 'b' }] })
})

module.exports = router