module.exports = function(app, config, firebase_admin, mysql_config) {
    var express = require('express');
    var router = express.Router();
    const url = require('url');


    const mysql = require('mysql2/promise');


    router.post('/new', function (req, res, next) {

        let newuser = async function () {
            const connection = await mysql.createConnection(mysql_config);

            const [rows, fields] = await connection.execute('insert into users (name) values (?)', [req.body.name]);
            await connection.execute('insert into tokens (token) values (?)', [req.body.token]);

            res.json({status: 1, userid: rows.insertId, name: req.body.name});
        };
        newuser();
    });
    router.get('/getbytoken', function (req, res, next) {
        let getusers = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select * from users where token = ?', [url.parse(req.url, true).query.token]);
            if (rows[0] && rows[0].id) {
                const [rows1, fields1] = await connection.execute('select notification.id, incedent.title, incedent.description from notification ' +
                    'left join incedentgroups on notification.incedentGroup_id = incedentgroups.id ' +
                    'left join incedent on incedent.id = incedentgroups.incedent_id ' +
                    'where user_id = ? and notification.complete = 0', [rows[0].id]);

                console.warn({status: 1, userid: rows[0].id, name: rows[0].name, notification: rows1});
                res.json({status: 1, userid: rows[0].id, name: rows[0].name, notification: rows1});
            }


            if (rows.length > 0 ) {

            } else {
                res.json({status: 0, userid: 0, name: '', notification: []});
            }
        };
        getusers();
    });

    return router;
};