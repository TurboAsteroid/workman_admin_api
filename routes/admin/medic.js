const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')
const helper = require('../../helpers/helper')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

router.get('/:moduleId', async function (req, res, next) {
  let [submodules] = await db.q(`select id, type, name from modules_structure where parent_id = ?`, [req.params.moduleId])
  res.json(submodules || [])
})

module.exports = router
