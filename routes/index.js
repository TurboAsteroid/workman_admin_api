let express = require('express')
let router = express.Router()

const menuRouter = require('./menu.js')
const testRegRouter = require('./testreg.js')

router.use('/menu', menuRouter)
router.use('/reg', testRegRouter)

module.exports = router