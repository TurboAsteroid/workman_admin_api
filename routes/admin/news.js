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
  let [sqlResult] = await db.q(`select * from news where module_id = ?`, [req.params.moduleId])

  res.json(sqlResult)
})

router.get('/details/:newsId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from news where id = ?`, [req.params.newsId])

  res.json(sqlResult[0])
})
router.post('/delete', async function (req, res, next) {
  if (!parseInt(req.body.newsId)) {
    return res.json({ status: 'error', message: 'Не указан ID для удаления' })
  }
  try {
    await db.q(`delete from news where id = ?`, [req.body.newsId])
  } catch (err) {
    return res.json({ status: 'error', message: 'Ошибка при удалении новости, попробуйте ещё раз' })
  }
  res.json({ status: 'ok', message: 'Новость удалена', remove: true, newsId: req.body.schedulenewsIdId })
})
router.post('/save/:newsId', upload.single('newsImage'), async function (req, res, next) {
  if (!req.body.moduleId || !req.body.title) {
    return res.json({ status: 'error', message: 'Поля "Заголовок новости", "id модуля" и "id новости" обязательны для заполнения' })
  }
  if (!parseInt(req.body.newsId)) {
    try {
      await db.q(`insert into news (module_id,link, title, description, full_description) values (?, ?, ?, ?, ?)`,
        [
          req.body.moduleId,
          req.body.link || '',
          req.body.title || '',
          req.body.description || '',
          req.body.full_description || ''
        ])
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
    }

    res.json({ status: 'ok', message: 'Новость успешно добавлена', redirect: true })
  } else {
    try {
      let image
      let reqPart = ''
      if (!req.body.previousImage && req.file) {
        // image = Buffer.form(fs.readFileSync(`${req.file.destination}${req.file.filename}`))
        image = fs.readFileSync(`${req.file.destination}${req.file.filename}`)

        reqPart = ', image = BINARY(:image)'
      }

      let params = {
        title: req.body.title || '',
        description: req.body.description || '',
        link: req.body.link || '',
        full_description: req.body.full_description || '',
        image: image,
        id: req.body.newsId,
        module_id: req.body.moduleId
      }

      let reult = await db.r(`Update news SET title=:title, description=:description, link=:link, full_description=:full_description ${reqPart} where id = :id and module_id = :module_id`, params)
      if (reult.affectedRows === 0) {
        return res.json({ status: 'error', message: 'Не верные параметры запроса, данный раздел не существует' })
      }
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
    }

    return res.json({ status: 'ok', message: 'Данные успешно обновлены' })
  }
})
module.exports = router
