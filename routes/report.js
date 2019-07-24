module.exports = function(app, config, router) {
    const helper = require('./helper');

    router.post('/report', async function (req, res, next) {
        res.json(await helper.getAllIncidents(req.body.date1, req.body.date2, req.body.status, req.body.search));
    });

    return router;
};