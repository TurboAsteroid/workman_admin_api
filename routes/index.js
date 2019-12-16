let express = require('express')
let router = express.Router()

const regRouter = require('./reg.js')
const infoRouter = require('./info')
const fileRouter = require('./file')
const registrationRouter = require('./registration')
const kioskRouter = require('./kiosk')

router.use('/reg', regRouter)
router.use('/info', infoRouter)
router.use('/file', fileRouter)
router.use('/registration', registrationRouter)

// киоск
router.use('/kiosk', kioskRouter)

module.exports = router
