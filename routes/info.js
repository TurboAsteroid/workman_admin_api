let express = require('express')
let router = express.Router()
const db = require('./db')

router.get('/getallrequests', async function (req, res, next) {
  let [sqlResult] = await db.q(`select title, body, user_email from requests `, [])
  let html = '<ul>'
  for (let i in sqlResult) {
    sqlResult[i].body = unescape(sqlResult[i].body)
    try {
      sqlResult[i].body = JSON.parse(sqlResult[i].body)
      if (sqlResult[i].body.error_desc) {
        sqlResult[i].body = sqlResult[i].body.error_desc
      }
    } catch (e) {}

    html += `<li><div>${sqlResult[i].user_email}<B>${unescape(sqlResult[i].title)}</B><div>${sqlResult[i].body}</div></div></li>`
  }
  html += '</ul>'
  return res.send(html)
})

module.exports = router
