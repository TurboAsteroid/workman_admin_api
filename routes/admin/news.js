const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')
const helper = require('../../helpers/helper')
const config = require('../../config')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs')
const rp = require('request-promise')
const Buffer = require('buffer').Buffer

router.get('/list/:moduleId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from news where module_id = ?`, [req.params.moduleId])
  res.json(sqlResult)
})

router.get('/details/:newsId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from news where id = ? limit 1`, [req.params.newsId])
  let [images] = await db.q(`select * from news_images where news_id = ?`, [req.params.newsId])
  sqlResult[0].galery = []
  for (let i in images) {
    sqlResult[0].galery.push({
      uid: images[i].id.toString(),
      name: images[i].original_name,
      status: 'done',
      url: await helper.getImageLink(images[i].name, 'original'),
      thumbUrl: await helper.getImageLink(images[i].name, '50_50'),
      description: images[i].description
    })
  }
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

router.post('/save/:newsId', upload.any(), async function (req, res, next) {
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
      let params = {
        title: req.body.title || '',
        description: req.body.description || '',
        link: req.body.link || '',
        full_description: req.body.full_description || '',
        id: req.body.newsId,
        module_id: req.body.moduleId
      }

      let reult = await db.r(`Update news SET title=:title, description=:description, link=:link, full_description=:full_description where id = :id and module_id = :module_id`, params)
      if (reult.affectedRows === 0) {
        return res.json({ status: 'error', message: 'Не верные параметры запроса, данный раздел не существует' })
      }
    } catch (err) {
      console.log(err)
      return res.json({ status: 'error', message: 'Ошибка при обновлении данных, попробуйте ещё раз' })
    }
    if (JSON.parse(req.body.oldFiles).length) {
      let [result] = await db.q(`select name from news_images where news_id = ? and id not in (${JSON.parse(req.body.oldFiles).join(',')})`, [req.body.newsId])
      for (let k in result) {
        helper.removeFiles(result[k].name)
      }
      await db.q(`Delete from news_images where news_id = ? and id not in (${JSON.parse(req.body.oldFiles).join(',')})`, [req.body.newsId])
    }
    let oldFiles = JSON.parse(req.body.oldFiles)
    let j = 0
    for (let i in oldFiles) {
      await db.q(`update news_images set description = ? where id = ?`, [JSON.parse(req.body.desc)[i], oldFiles[i]])
      j++
    }
    if (req.files.length) {
      let values = []
      for (let i in req.files) {
        let filename = await helper.saveAndCrop(req.files[i])
        values.push(`(${req.body.newsId}, '${filename}', '${req.files[i].originalname.split('.')[0]}', '${JSON.parse(req.body.desc)[j] || ''}')`)
        j++
      }
      await db.q(`insert into news_images (news_id, name, original_name, description) values ${values.join(',')}`, [])
    }
    return res.json({ status: 'ok', message: 'Данные успешно обновлены' })
  }
})
module.exports = router
