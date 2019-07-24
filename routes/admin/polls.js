const express = require('express')
const router = express.Router()
const db = require('../db')
const config = require('../../config')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require("fs")
const rp = require('request-promise')
const Buffer = require('buffer').Buffer

router.get('/list/:moduleId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from polls where module_id = ?`, [req.params.moduleId])

  res.json(sqlResult)
})
router.get('/question/:questionId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from questions where id = ?`, [req.params.questionId])
  if (sqlResult[0]) {
    let [sqlResult2] = await db.q(`select * from options where question_id = ?`, [req.params.questionId])
    sqlResult[0].options = sqlResult2
    return res.json(sqlResult[0])
  }
  return res.json([])
})
router.get('/questions/list/:pollId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from questions where poll_id = ?`, [req.params.pollId])

  res.json(sqlResult)
})

router.get('/details/:pollId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from polls where polls.id = ?`, [req.params.pollId])

  res.json(sqlResult[0])
})
router.post('/question/save', async function (req, res, next) {
  if (!req.body.title || !req.body.pollId) {
    return res.json({ status: 'error', message: 'Поле "Название опроса" обязательно для заполнения' })
  }
  if (!parseInt(req.body.id)) {
    try {
      let [result] = await db.q(`insert into questions (poll_id, title, type) values (?, ?, ?)`,
        [
          parseInt(req.body.pollId),
          req.body.title,
          parseInt(req.body.type) || 0
        ])
      req.body.id = result.insertId
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при добавлении данных, попробуйте ещё раз' })
    }
  } else {
    let params = {
      title: req.body.title || '',
      type: parseInt(req.body.type) || 0,
      id: req.body.id
    }

    let result = await db.r(`Update questions SET title=:title, type=:type where id = :id`, params)
    if (result.affectedRows === 0) {
      return res.json({ status: 'error', message: 'Не верные параметры запроса, данный раздел не существует' })
    }
  }

  await db.r(`delete from options where question_id = :question_id`, { question_id: req.body.id })
  let values = []
  for (let i in req.body.options) {
    values.push([req.body.id, req.body.options[i]])
  }

  await db.q(`insert into options (question_id, title) values ?`, [values])

  res.json({ status: 'ok', message: 'Опрос успешно добавлен', redirect: true })
})
router.post('/save', async function (req, res, next) {
  if (!req.body.moduleId || !req.body.title) {
    return res.json({ status: 'error', message: 'Поле "Название опроса" обязательно для заполнения' })
  }
  console.log(req.body)
  if (!parseInt(req.body.pollId)) {
    try {
      let [result] = await db.q(`insert into polls (module_id, title, description, dateEnd) values (?, ?, ?, ?)`,
        [
          req.body.moduleId,
          req.body.title,
          req.body.description || '',
          req.body.dateEnd || null
        ])
      req.body.pollId = result.insertId
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при добавлении данных, попробуйте ещё раз' })
    }

    res.json({ status: 'ok', message: 'Опрос успешно добавлен', redirect: true, pollId: req.body.pollId })
  } else {
    try {
      let params = {
        title: req.body.title || '',
        description: req.body.description || '',
        id: req.body.pollId,
        module_id: req.body.moduleId,
        date_end: req.body.dateEnd || new Date()
      }

      let result = await db.r(`Update polls SET title=:title, description=:description, dateEnd=:date_end where id = :id and module_id = :module_id`, params)
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', message: 'Не верные параметры запроса, данный раздел не существует' })
      }
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
    }

    return res.json({ status: 'ok', message: 'Данные успешно обновлены', pollId: req.body.pollId })
  }
})
module.exports = router
