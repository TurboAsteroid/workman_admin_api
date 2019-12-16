const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')
const helper = require('../../helpers/helper')
const config = require('../../config')

router.get('/list/:moduleId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from requests where module_id = ? limit 1`, [req.params.moduleId])
  res.json(sqlResult)
})

router.get('/details/:feedbackId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from requests where id = ? limit 1`, [req.params.newsId])
  // let [images] = await db.q(`select * from news_images where news_id = ?`, [req.params.newsId])
  // sqlResult[0].galery = []
  // for (let i in images) {
  //   sqlResult[0].galery.push({
  //     uid: images[i].id,
  //     name: images[i].original_name,
  //     url: await helper.getImageLink(images[i].name, 'original'),
  //     thumbUrl: await helper.getImageLink(images[i].name, '50_')
  //   })
  // }
  // console.log(sqlResult[0].galery)
  res.json(sqlResult[0])
})

router.post('/save/:feedbackId', async function (req, res, next) {
  if (!req.body.moduleId || !req.body.title) {
    return res.json({ status: 'error', message: 'Поля "Заголовок новости", "id модуля" и "id новости" обязательны для заполнения' })
  }
  if (!parseInt(req.body.newsId)) {
    try {
      let [result] = await db.q(`insert into news (module_id,link, title, description, full_description) values (?, ?, ?, ?, ?)`,
        [
          req.body.moduleId,
          req.body.link || '',
          req.body.title || '',
          req.body.description || '',
          req.body.full_description || ''
        ])
      req.body.newsId = result.insertId
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
    }
  } else {
    try {
      console.log('req.body', req.body)

      let params = {
        title: req.body.title || '',
        description: req.body.description || '',
        link: req.body.link || '',
        full_description: req.body.full_description || '',
        id: req.body.newsId,
        module_id: req.body.moduleId
      }

      let result = await db.r(`Update news SET title=:title, description=:description, link=:link, full_description=:full_description where id = :id and module_id = :module_id`, params)
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', message: 'Не верные параметры запроса, данный раздел не существует' })
      }
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
    }

    if (req.body.oldFiles.length) {
      await db.q(`delete from news_images where news_id not in (${req.body.oldFiles})`, [])
    }
    if (req.files.length) {
      let values = []
      for (let i in req.files) {
        let filename = await helper.saveAndCrop(req.files[i])
        values.push(`(${req.body.newsId}, '${filename}', '${req.files[i].originalname.split('.')[0]}')`)
      }
      await db.q(`insert into news_images (news_id, name, original_name) values ${values.join(',')}`, [])
    }
    return res.json({ status: 'ok', message: 'Данные успешно обновлены' })
  }
})
module.exports = router
