const express = require('express')
const router = express.Router()
const rp = require('request-promise')

router.get('/', async function (req, res, next) {
  let options = {
    method: 'POST',
    uri: 'https://apps.elem.ru/corp_api/getApplication',
    body: {
      phone: req.query.phone,
      card: req.query.card
    },
    json: true // Automatically stringifies the body to JSON
  }
  let result
  try {
    result = await rp(options)
  } catch (e) {
    console.warn(e)
  }

  console.log(result)

  res.json({ status: 'OK', data: result })
})
// router.get('/r', async function (req, res, next) {
//   let options = {
//     method: 'POST',
//     uri: 'http://10.1.100.33:3000/getApplication/recover',
//     body: {
//       phone: req.query.phone,
//       tmpPass: req.query.tmpPass,
//       password: req.query.password
//     },
//     json: true // Automatically stringifies the body to JSON
//   }
//   let result
//   try {
//     result = await rp(options)
//   } catch (e) {
//     console.warn(e)
//   }
//
//   console.log(result)
//
//   res.json({ status: 'OK', data: result })
// })
// router.get('/t', async function (req, res, next) {
//   let options = {
//     method: 'GET',
//     uri: 'http://10.1.100.33:3000/getApplication',
//     body: {},
//     json: true // Automatically stringifies the body to JSON
//   }
//   let result
//   try {
//     result = await rp(options)
//   } catch (e) {
//     console.warn(e)
//   }
//
//   console.log(result)
//
//   res.json({ status: 'OK', data: result })
// })

module.exports = router
