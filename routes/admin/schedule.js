const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')
const config = require('../../config')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require("fs")
const rp = require('request-promise')
const Buffer = require('buffer').Buffer

router.get('/list/:moduleId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from schedule where module_id = ?`, [req.params.moduleId])

  res.json(sqlResult)
})
// router.get('/question/:questionId', async function (req, res, next) {
//   let [sqlResult] = await db.q(`select * from questions where id = ?`, [req.params.questionId])
//   if (sqlResult[0]) {
//     let [sqlResult2] = await db.q(`select * from options where question_id = ?`, [req.params.questionId])
//     sqlResult[0].options = sqlResult2
//     return res.json(sqlResult[0])
//   }
//   return res.json([])
// })
// router.get('/questions/list/:pollId', async function (req, res, next) {
//   let [sqlResult] = await db.q(`select * from questions where poll_id = ?`, [req.params.pollId])
//
//   res.json(sqlResult)
// })
//
router.get('/details/:scheduleId?', async function (req, res, next) {
  let result = {}
  if (req.params.scheduleId) {
    let [sqlResult] = await db.q(`select * from schedule where id = ?`, [req.params.scheduleId])
    result = sqlResult[0]

    let [pointsResult] = await db.q(`select schedule_points.*, schedule_item.datetime as title from schedule_points left join schedule_item on schedule_points.id = schedule_item.point_id where schedule_item.schedule_id = ?`, [req.params.scheduleId])
    result.schedule = pointsResult
  }
  else {
    let [pointsResult] = await db.q(`select schedule_points.*, "" as title from schedule_points `, [])
    result.schedule = pointsResult
  }
  res.json(result)
})

router.post('/delete', async function (req, res, next) {
  if (!parseInt(req.body.scheduleId)) {
    return res.json({ status: 'error', message: 'Не указан ID для удаления' })
  }
  try {
    await db.q(`delete from schedule where id = ?`, [req.body.scheduleId])
  } catch (err) {
    return res.json({ status: 'error', message: 'Ошибка при удалении расписания, попробуйте ещё раз' })
  }
  res.json({ status: 'ok', message: 'Расписание удалено', remove: true, scheduleId: req.body.scheduleId })
})
router.post('/save', async function (req, res, next) {
  console.log(req.body)
  if (!req.body.module_id || !req.body.header) {
    return res.json({ status: 'error', message: 'Поле "Название объекта" обязательно для заполнения' })
  }

  if (!parseInt(req.body.scheduleId)) {
    try {
      let [result] = await db.q(`insert into schedule (header, subheader, scheduleName, description, module_id) values (?,?,?,?,?)`,
        [
          req.body.header,
          req.body.subheader || '',
          req.body.scheduleName || '',
          req.body.description || '',
          req.body.module_id
        ])
      req.body.scheduleId = result.insertId

      let items = []
      for (let i in req.body.schedule) {
        if (req.body.schedule[i] !== null) items.push([i, req.body.schedule[i] || '', req.body.scheduleId])
      }
      // await db.q(`delete from schedule_item where schedule_id = ?`, [req.body.scheduleId])
      await db.q(`insert into schedule_item (point_id, datetime, schedule_id) values ?`, [items])
    } catch (err) {
      return res.json({ status: 'error', message: 'Ошибка при добавлении данных, попробуйте ещё раз' })
    }

    res.json({ status: 'ok', message: 'Опрос успешно добавлен', redirect: true, scheduleId: req.body.scheduleId })
  } else {
    try {
      let params = {
        header: req.body.header || '',
        subheader: req.body.subheader || '',
        scheduleName: req.body.scheduleName || '',
        description: req.body.description || '',
        id: req.body.scheduleId,
        module_id: req.body.module_id
      }
      await db.r(`Update schedule SET header=:header, subheader=:subheader, scheduleName=:scheduleName, description=:description where id = :id and module_id = :module_id`, params)
      let items = []
      for (let i in req.body.schedule) {
        if (req.body.schedule[i] !== null) items.push([i, req.body.schedule[i] || '', req.body.scheduleId])
      }
      await db.q(`delete from schedule_item where schedule_id = ?`, [req.body.scheduleId])
      await db.q(`insert into schedule_item (point_id, datetime, schedule_id) values ?`, [items])
    } catch (err) {
      return res.json({ status: 'error', message: 'Ошибка при добавлении данных, попробуйте ещё раз' })
    }

    res.json({ status: 'ok', message: 'Опрос успешно обновлен', redirect: true, scheduleId: req.body.scheduleId })
  }
})
module.exports = router
