module.exports = function(app, config, firebase_admin) {
    var express = require('express');
    var router = express.Router();

    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');


    /* GET home page. */
    router.get('/', function (req, res, next) {
        let getusers = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select name as text, id as value from Users', []);
            res.json(rows);
        };
        getusers();
    });

    return router;
};