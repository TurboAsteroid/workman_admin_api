const express = require('express')
const router = express.Router()
const db = require('../../helpers/db')

router.get('/', async function (req, res, next) {
  let sqlResult = await db.q(`select * from main_menu`, [])
  res.json(sqlResult[0])
})

module.exports = router
