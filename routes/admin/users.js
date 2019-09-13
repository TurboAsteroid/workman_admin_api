const express = require('express')
const router = express.Router()
const config = require('../../config')
const rp = require('request-promise')

router.post('/add', async function (req, res, next) {
  let options = {
    method: 'POST',
    uri: config.mainApi + 'getApplication',
    body: {
      phone: req.body.user,
      card: req.body.card
    },
    json: true
  }
  let result
  try {
    result = await rp(options)
  } catch (e) {
    console.warn(e)
    return res.json({ status: 'error', message: 'Не удалось обработать запрос, попробуйте позже' })
  }

  res.json({
    status: result.status,
    message: result.data.message,
    tmpPassword: result.tmpPassword
  })
})

module.exports = router
