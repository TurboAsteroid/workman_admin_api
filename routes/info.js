let express = require('express')
let router = express.Router()
const db = require('../helpers/db')
let firebaseAdmin = require('firebase-admin')
let serviceAccount = require('./workman-nightwelf-firebase-adminsdk-veh3v-248a3e2037.json')
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://workman-nightwelf.firebaseio.com'
})

router.get('/getallrequests', async function (req, res, next) {
  let [sqlResult] = await db.q(`select id, title, body, user_email, user_id from requests `, [])
  let html = '<ol>'
  for (let i in sqlResult) {
    sqlResult[i].body = unescape(sqlResult[i].body)
    try {
      sqlResult[i].body = JSON.parse(sqlResult[i].body)
      if (sqlResult[i].body.error_desc) {
        sqlResult[i].body = sqlResult[i].body.error_desc
      }
      if (sqlResult[i].body.body) {
        sqlResult[i].body = sqlResult[i].body.body
      }
    } catch (e) {}
    html += `<li><B>${unescape(sqlResult[i].title)}</B>: ${sqlResult[i].body} (${sqlResult[i].user_id})</li>`
    // html += `<li><div>${sqlResult[i].user_email}<B>${unescape(sqlResult[i].title)}</B><div>${sqlResult[i].body}</div></div></li>`
  }
  html += '</ol>'
  return res.send(html)
})
router.get('/getstats', async function (req, res, next) {
  // let db = firebaseAdmin.database()
  // let collectionRef = db.ref('/users/9045457114')
  // collectionRef.on('value', function (snapshot) {
  //   let a = snapshot.val()
  //   console.log(a)
  //   return res.send(a)
  // }, function (errorObject) {
  //   console.log('The read failed: ' + errorObject.code)
  // })

  // const db = firebaseAdmin.firestore()
  // let users = await db.collection('users').get()
  // console.log('users', users)
  // for (let user of users.docs) {
  //   console.log(user.id)
  //   let screens = await db.collection('screens').get()
  //   console.log(screens)
  //   // for (let screen of screens.docs) {
  //   //   console.log(screen.id)
  //   // }
  //
  //   break
  // }
  let users = ['9630444499']

  let modules = ['Settings',
    'SimpleHtml',
    'Siz',
    'Tutorial',
    'VacationScreen',
    'OneCardPageVk',
    'PaySheet',
    'PollStepByStep',
    'Polls',
    'PollsSettings',
    'ProResults',
    'FullscreenImage',
    'Index',
    'Intro',
    'ListEvent',
    'ListOfVaccinationScreen',
    'ListSchedule',
    'CardVk',
    'Checks',
    'Colleagues',
    'EducationScreen',
    'FoodScreen',
    'About',
    'AdvancedPerson',
    'Book',
    'BugReportScreen',
    'BusForecasts']
  let reportU = {}
  let report = {}
  const db = firebaseAdmin.firestore()
  let html = ''
  for (let i in users) {
    let user = users[i]
    // html += `<div><h3>${user}</h3><ul>`
    for (let j in modules) {
      let module = modules[j]
      let visits = await db.collection(`/screens/${user}/${module}`).get()
      let count = 0
      for (let user of visits.docs) {
        count++
      }
      // html += `<li><b>${module}:</b> ${count}</li>`
      !report[module] ? report[module] = count : report[module] += count
      if (!reportU[user]) reportU[user] = {}
      if (!reportU[user][module]) {reportU[user][module] = count}
      else {reportU[user][module] += count}

    }
    // html += `</ul></div>`
    console.log(i, user)
  }
  // html += `</br></br></br><ul>`
  for (let l in report) {
    html += `<li><b>${l}</b>: ${report[l]}</li>`
  }
  html += `</ul>`

  console.log('report', report)
  console.log('reportU', reportU)

  return res.send(html)
  // let users = await db.collection('/screens/9630444499/').get()
  // console.log(users.empty)
  // for (let user of use   rs.docs) {
  //   console.log('12', user.id)
  // }
})

module.exports = router
