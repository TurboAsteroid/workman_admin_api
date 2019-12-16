const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')
const helper = require('../../helpers/helper')
const axios = require('axios')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

router.post('/save', async function (req, res, next) {
  if (!req.body.moduleId) {
    return res.json({ status: 'error', message: 'не указан id раздела' })
  }
  try {
    await db.q(`delete from checkUp where module_id = ?`, [req.body.moduleId])
    let insert = []
    for (let i in req.body.departments) {
      req.body.departments[i].module_id = parseInt(req.body.moduleId)
      req.body.departments[i].start = new Date(req.body.departments[i].start)
      req.body.departments[i].end = new Date(req.body.departments[i].end)
      insert.push(Object.values(req.body.departments[i]))
    }
    await db.q(`insert into checkUp (percent, start, end, code, module_id) values ?`, [insert])
  } catch (err) {
    console.warn(err)
    return res.json({
      status: 'error',
      data: {
        message: 'Не удалось обработать запрос, попробуйте позже'
      }
    })
  }
  return res.json({ status: 'ok', message: 'Данные успешно обновлены' })
})

router.get('/:moduleId', async function (req, res, next) {
  let url = `https://elem-pre.elem.ru/spline/api/platform`
  let departmantsArray
  try {
    let response = await axios.get(url)
    departmantsArray = response.data[0].departments_personal
  } catch (e) {
    console.warn(e)
    return res.json({
      status: 'error',
      data: {
        message: 'Не удалось обработать запрос, попробуйте позже'
      }
    })
  }
  let departmantsObject = {}
  for (let departmant of departmantsArray) {
    departmantsObject[departmant.code] = departmant
  }

  let [data] = await db.q(`select * from checkUp where module_id = ?`, [req.params.moduleId])
  // res.json(submodules || [])

  for (let value of data) {
    departmantsObject[value.code] = {
      ...departmantsObject[value.code],
      ...value
    }
  }
  res.json({
    status: 'OK',
    data: departmantsObject
  })
})
module.exports = router
