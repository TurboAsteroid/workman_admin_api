module.exports = function(app, config, firebase_admin) {
    var express = require('express');
    var router = express.Router();
    const url = require('url');

    const mysql_config = app.get('mysql_config');

    const mysql = require('mysql2/promise');

    router.post('/new', function (req, res, next) {

            let ad = app.get('AD');

            let login = req.body.login;
            login = login.split('@')[0];

            ad.authenticate(login + '@elem.ru', req.body.password, function(err, auth) {
                if (err || !auth) {
                    console.log('err!', err);
                    res.json({status: 0, userid: 0, name: ""});
                } else {
                    ad.findUser(login, function(err, user) {
                        if (err || !user) {
                            res.json({status: 0, userid: 0, name: ""});
                        }
                        else {
                            let newuser = async function () {
                                const connection = await mysql.createConnection(mysql_config);
                                const [rows, fields] = await connection.execute('INSERT IGNORE into users (name, login) values (?, ?)', [user.displayName, req.body.login]);
                                await connection.execute('insert into tokens (token, user_id) values (?, ?)', [req.body.token, rows.insertId]);

                                res.json({status: 1, userid: rows.insertId, name: user.displayName});

                                connection.close();
                            };
                            newuser();
                        }
                    });
                }
            });
    });
    router.get('/getbytoken', function (req, res, next) {
        let getusers = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select users.id, users.login, users.name from tokens left join users on users.id = tokens.user_id where tokens.token = ?', [url.parse(req.url, true).query.token]);
            if (rows.length > 0 && rows[0] && rows[0].id) {
                const [rows1, fields1] = await connection.execute('select notification.id, notification.complete, incedent.title, incedent.description from notification ' +
                    'left join incedentgroups on notification.incedentGroup_id = incedentgroups.id ' +
                    'left join incedent on incedent.id = incedentgroups.incedent_id ' +
                    'where user_id = ? and (notification.complete = 0 or TIMESTAMPDIFF(HOUR, notification.timesent, NOW()) <= 72) order by notification.complete, incedent.datetime desc', [rows[0].id]);
                // console.warn({status: 1, userid: rows[0].id, name: rows[0].name, notification: rows1});
                res.json({status: 1, userid: rows[0].id, name: rows[0].name, notification: rows1});
            } else {
                res.json({status: 0, userid: 0, name: '', notification: []});
            }
            connection.close();
        };
        getusers();
    });

    return router;
};