let express = require('express')
let helper = require('../helpers/helper')
let axios = require('axios')
let router = express.Router()
const db = require('../helpers/db')

router.post('/aprove', async function (req, res, next) {
  if (!req.body.phone || !req.body.code || !req.body.card) {
    return res.json({
      status: 0,
      data: {
        message: 'Укажите телефон и код подтверждения'
      }
    })
  }

  try {
    let [result] = await db.q(`select * from aproveCode where phone = ? and code = ?`, [req.body.phone, req.body.code])
    console.log(result)
    if (!result.length) {
      return res.json({
        status: 0,
        data: {
          message: 'Указан не верный код, попробуйте повтороить операцию'
        }
      })
    }

    result = await axios.post('https://apps.elem.ru/corp_api/getApplication', {
      phone: req.body.phone,
      card: req.body.card
    })
    if (result.data.status !== 'OK') throw new Error('Невозможно зарегистрировать пользователя')

    result = await axios.post('https://a2p-api.megalabs.ru/sms/v1/sms', {
      'from': 'DMEPUMMC',
      'to': parseInt(`7${req.body.phone}`),
      'message': `ЭЛЕМ Персонал. Новый разовый пароль для входа ${result.data.tmpPassword}. Скачать приложение по ссылке ${result.data.link}`
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: 'UF_urlaelectro',
        password: 't3q7qtao'
      }
    })

    await db.q(`delete from aproveCode where phone = ?`, [req.body.phone])
    return res.json({
      status: 1,
      data: {
        message: 'Разовый пароль и ссылка на скачивание приложения отправлены вам на телефон.'
      }
    })
  } catch (error) {
    console.warn(error)
    return res.json({
      status: 0,
      data: {
        message: 'Не удалось отправить sms'
      }
    })
  }
})
router.post('/phone', async function (req, res, next) {
  if (!req.body.phone || !req.body.card) {
    return res.json({
      status: 0,
      data: {
        message: 'Не указан телефон, попробуйте ещё раз'
      }
    })
  }

  try {
    let aproveCode = helper.randomNumber()
    await db.q(`delete from aproveCode where phone = ?`, [req.body.phone])
    await db.q(`insert into aproveCode (code, phone) values (?, ?)`, [aproveCode, req.body.phone])
    let result = await axios.post('https://a2p-api.megalabs.ru/sms/v1/sms', {
      'from': 'DMEPUMMC',
      'to': parseInt(`7${req.body.phone}`),
      'message': `ЭЛЕМ Персонал. Код подтверждения вашего телефона: ${aproveCode}`
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: 'UF_urlaelectro',
        password: 't3q7qtao'
      }
    })
    if (result.data.result.status.code !== 0) throw new Error('Невозможно отправить sms')

    return res.json({
      status: 1,
      data: {
        message: 'Код подтверждения отправлен'
      }
    })
  } catch (error) {
    console.warn(error)
    return res.json({
      status: 0,
      data: {
        message: 'Не удалось отправить sms'
      }
    })
  }
})

module.exports = router
