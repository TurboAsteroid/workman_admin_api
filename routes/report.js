module.exports = function(app, config, router) {
    const helper = require('./helper');
    const mysql_config = app.get('mysql_config');

    router.get('/report', function (req, res, next) {
        let timestart = req.query.timestart;
        let timeend= req.query.timeend;
        let status = req.query.status;
        let value = req.query.value;

        res.json(helper.getAllIncidents(mysql_config, timestart, timeend, status, value));
    });

    return router;
};