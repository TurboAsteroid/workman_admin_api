const express = require('express')
const jwt = require('jsonwebtoken');
const router = express.Router()
const db = require('../../helpers/db')
const config = require('../../config')

async function getSuperadminStructure () {
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
  return [childTree, resultById]
}

router.get('/', async function (req, res, next) {
  let r = await jwt.verify(req.headers.authorization.split(' ')[1], config.jwtSecret)
  if (r.user === '9058074101') {
    return res.json(await getSuperadminStructure())
  }
  const sqlResult = await db.q(`
    select user_id, user, modules_structure.*, module_id as id
      from users
    join admin_modules_access
      on users.id = admin_modules_access.user_id
    join modules_structure
      on modules_structure.id = admin_modules_access.module_id
    where admin = 1 and user = ? and adminToken = ?
    `, [r.user, r.token]
  )

  // let sqlResult = await db.q(`select * from modules_structure order by sort_id`, [])
  // let childTree = {}
  let resultById = {}

  for (let r in sqlResult[0]) {
    let menuIntem = sqlResult[0][r]
    // if (!childTree[menuIntem.parent_id]) {
    //   childTree[menuIntem.parent_id] = []
    // }
    // childTree[menuIntem.parent_id].push(menuIntem.id)
    resultById[menuIntem.id] = menuIntem
  }

  return res.json([false, resultById])
})

module.exports = router
