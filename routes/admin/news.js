const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/list/:moduleId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from news where module_id = ?`, [req.params.moduleId])

  res.json(sqlResult)
})
router.get('/list/:moduleId', async function (req, res, next) {
  let [sqlResult] = await db.q(`select * from news where module_id = ?`, [req.params.moduleId])

  res.json(sqlResult)
})

module.exports = router
