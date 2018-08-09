module.exports = function(app, config, firebase_admin, mysql_config) {
    var express = require('express');
    var router = express.Router();

    const mysql = require('mysql2/promise');


    /* GET home page. */
    router.get('/', function (req, res, next) {
        let getusers = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select * from Users', []);
            rows.forEach(function (item) {
                item.text = item.name;
                item.value = item.id;
            });
            res.json(rows);
        };
        getusers();
    });

    return router;
};