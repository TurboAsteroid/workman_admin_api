module.exports = function(app, config, router) {
    const path = require('path');
    const mime = require('mime');
    const fs = require('fs');
    const crypto = require('crypto');

    router.get('/file/download', async function (req, res, next) {
        let file = './inc_files/' + crypto.createHash('md5').update(req.query.incident_id).digest("hex") + '/' + req.query.filename;

        let filename = path.basename(file);
        let mimetype = mime.getType(file);

        // res.setHeader('Content-disposition', 'inline; filename="' + filename);
        res.setHeader('Content-type', mimetype);

        res.download(file);
        // let filestream = fs.createReadStream(file);
        // filestream.pipe(res);
    });

    return router;
};