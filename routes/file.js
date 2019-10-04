const config = require('../config')

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')

router.get('/get/:size/:fileName', function (req, res, next) {
  let filepath = path.join(config.imagesPath, req.params.size !== 'original' ? 'thumbs' : '', req.params.size, req.params.fileName)
  fs.access(filepath, fs.constants.R_OK, (err) => {
    if (err) {
      return res.json({ status: 'error', message: 'Файл не существует' })
    } else {
      res.setHeader('Content-type', 'image/jpeg')
      let fileStream = fs.createReadStream(filepath)
      fileStream.pipe(res)
    }
  })
})

module.exports = router
