let express = require('express')
let router = express.Router()

const passport = require('passport')
const structureRouter = require('./structure.js')
const menuRouter = require('./mainMenu.js')
const sectionRouter = require('./section.js')
const newsRouter = require('./news.js')
const usersRouter = require('./users.js')
const pollsRouter = require('./polls.js')
const scheduleRouter = require('./schedule.js')
const feedbackRouter = require('./feedback.js')
const galleryRouter = require('./gallery.js')
const medicRouter = require('./medic.js')
const checkUpRouter = require('./checkUp.js')

router.use('/mainMenu', menuRouter)
router.use('/structure', passport.authenticate('jwt'), structureRouter)
router.use('/section', passport.authenticate('jwt'), sectionRouter)
router.use('/news', passport.authenticate('jwt'), newsRouter)
router.use('/users', passport.authenticate('jwt'), usersRouter)
router.use('/polls', passport.authenticate('jwt'), pollsRouter)
router.use('/schedule', passport.authenticate('jwt'), scheduleRouter)
router.use('/feedback', passport.authenticate('jwt'), feedbackRouter)
router.use('/gallery', passport.authenticate('jwt'), galleryRouter)
router.use('/medic', passport.authenticate('jwt'), medicRouter)
router.use('/checkup', passport.authenticate('jwt'), checkUpRouter)

module.exports = router
