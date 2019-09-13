let express = require('express')
let router = express.Router()

const regRouter = require('./reg.js')
const infoRouter = require('./info')

router.use('/reg', regRouter)
router.use('/info', infoRouter)

module.exports = router