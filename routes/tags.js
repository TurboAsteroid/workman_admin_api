let DataBase = require('../routes/db');

module.exports = function(app, config, router) {
    const mysql = require('mysql2/promise');

    router.get('/tags/get', async function (req, res, next) {
        //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
        const [rows1, fields1] = await DataBase.Execute(`select tags.id as value, tags.text from tags`);
        res.json(rows1);
        //connection.end();
    });

    return router;
};