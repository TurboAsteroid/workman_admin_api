const express = require('express')
const router = express.Router()
const db = require('../db')

router.post('/', async function (req, res, next) {
  if (!req.body.name || !req.body.parent_id) {
    return res.json({ status: 'error', message: 'Поля "Название раздела" и "Родительский раздел" обязательны для заполнения' })
  }

  try {
    await db.q(`Update modules_structure SET parent_id=?, name=?, description=?, content=? where id = ?`, [req.body.parent_id, req.body.name, req.body.description || '', req.body.content || '', req.body.moduleId])
  } catch (err) {
    console.log(err)
    return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
  }

  res.json({ status: 'ok', message: 'Данные успешно обновлены' })
})

module.exports = router
