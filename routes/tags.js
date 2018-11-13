module.exports = function(app, config, router) {
    const mysql = require('mysql2/promise');

    router.get('/tags/get', async function (req, res, next) {
        const connection = await mysql.createConnection(config.dbConfig);
        const [rows1, fields1] = await connection.execute(`select tags.id as value, tags.text from tags`);
        res.json(rows1);
        connection.end();
    });

    return router;
};