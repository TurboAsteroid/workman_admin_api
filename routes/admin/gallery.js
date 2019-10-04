const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')
const helper = require('../../helpers/helper')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.get('/details/:moduleId', async function (req, res, next) {
  let [images] = await db.q(`select * from gallery_images where module_id = ?`, [req.params.moduleId])
  let result = { gallery: [] }
  for (let i in images) {
    result['gallery'].push({
      uid: images[i].id.toString(),
      name: images[i].original_name,
      status: 'done',
      url: await helper.getImageLink(images[i].name, 'original'),
      thumbUrl: await helper.getImageLink(images[i].name, '50_50'),
      description: images[i].description
    })
  }
  res.json(result)
})

router.post('/save/:moduleId', upload.any(), async function (req, res, next) {
  if (!req.params.moduleId) {
    return res.json({ status: 'error', message: 'Поля "id модуля" обязательно для заполнения' })
  }

  if (JSON.parse(req.body.oldFiles).length) {
    let [result] = await db.q(`select name from gallery_images where module_id = ? and id not in (${JSON.parse(req.body.oldFiles).join(',')})`, [req.params.moduleId])
    for (let k in result) {
      helper.removeFiles(result[k].name)
    }
    await db.q(`Delete from gallery_images where news_id = ? and id not in (${JSON.parse(req.body.oldFiles).join(',')})`, [req.params.moduleId])
  }
  let oldFiles = JSON.parse(req.body.oldFiles)
  let j = 0
  for (let i in oldFiles) {
    await db.q(`update gallery_images set description = ? where id = ?`, [JSON.parse(req.body.desc)[i], oldFiles[i]])
    j++
  }
  if (req.files.length) {
    let values = []
    for (let i in req.files) {
      let filename = await helper.saveAndCrop(req.files[i])
      values.push(`(${req.params.moduleId}, '${filename}', '${req.files[i].originalname.split('.')[0]}', '${JSON.parse(req.body.desc)[j] || ''}')`)
      j++
    }
    await db.q(`insert into gallery_images (module_id, name, original_name, description) values ${values.join(',')}`, [])
  }
  return res.json({ status: 'ok', message: 'Данные успешно обновлены' })

})
module.exports = router
