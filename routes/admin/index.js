let express = require('express')
let router = express.Router()

const structureRouter = require('./structure.js')
const menuRouter = require('./mainMenu.js')
const sectionRouter = require('./section.js')
const newsRouter = require('./news.js')
const usersRouter = require('./users.js')

router.use('/mainMenu', menuRouter)
router.use('/structure', structureRouter)
router.use('/section', sectionRouter)
router.use('/news', newsRouter)
router.use('/users', usersRouter)

module.exports = router
