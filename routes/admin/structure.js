const express = require('express')
const router = express.Router()
const db = require('../db')

router.get('/', async function (req, res, next) {
  let sqlResult = await db.q(`select * from modules_structure order by sort_id`, [])
  let childTree = {}
  let resultById = {}

  for (let r in sqlResult[0]) {
    let menuIntem = sqlResult[0][r]
    if (!childTree[menuIntem.parent_id]) {
      childTree[menuIntem.parent_id] = []
    }
    childTree[menuIntem.parent_id].push(menuIntem.id)
    resultById[menuIntem.id] = menuIntem
  }

  res.json([childTree, resultById])
})

module.exports = router
