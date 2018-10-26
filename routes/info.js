module.exports = function(app, config, router) {
    const helper = require('./helper');
    router.get('/getallstatuses', function (req, res, next) {
        res.json(helper.getAllStatuses());
    });

    return router;
};