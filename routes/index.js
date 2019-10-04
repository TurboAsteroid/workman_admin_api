let express = require('express')
let router = express.Router()

const regRouter = require('./reg.js')
const infoRouter = require('./info')
const fileRouter = require('./file')

router.use('/reg', regRouter)
router.use('/info', infoRouter)
router.use('/file', fileRouter)

module.exports = router