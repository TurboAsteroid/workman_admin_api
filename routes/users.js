module.exports = function(app, config, firebase_admin, router) {
    // var express = require('express');
    // var router = express.Router();
    const url = require('url');

    const mysql_config = app.get('mysql_config');

    const mysql = require('mysql2/promise');

    router.post('/users/logout', async function (req, res, next) {
        const connection = await mysql.createConnection(mysql_config);
        const [rows, fields] = await connection.execute('delete from tokens where token = ?', [req.body.token]);

        res.json({status: '1'});
    });

    router.get('/users/getADuser', function (req, res, next) {
        let ad = app.get('AD');
        let query = "(cn=*" + req.query.user + "*)";
        ad.findUsers(query, true, function(err, users) {
            if (err) {
                console.log('ERROR: ' +JSON.stringify(err));
                return;
            }

            res.json(users);
        });
    });

    router.post('/users/new', function (req, res, next) {
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
                                const [rows, fields] = await connection.execute('select * from users where login = ?', [req.body.login]);
                                let user_id;
                                if (rows.length) {
                                    user_id = rows[0].id;
                                } else {
                                    const [newuserR, newuserF] = await connection.execute('INSERT into users (name, login) values (?, ?)', [user.displayName, req.body.login]);
                                    user_id = newuserR.insertId;
                                }

                                await connection.execute('insert into tokens (token, user_id) values (?, ?)', [req.body.token, user_id]);

                                res.json({status: 1, userid: rows.insertId, name: user.displayName});

                                connection.close();
                            };
                            newuser();
                        }
                    });
                }
            });
    });
    router.get('/users/getbytoken', function (req, res, next) {
        let getusers = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select users.id, users.login, users.name from tokens left join users on users.id = tokens.user_id where tokens.token = ?', [url.parse(req.url, true).query.token]);
            if (rows.length > 0 && rows[0] && rows[0].id) {
                const [rows1, fields1] = await connection.execute('select notification.id, notification.complete, incident.title, incident.description from notification ' +
                    'left join incidentgroups on notification.incidentGroup_id = incidentgroups.id ' +
                    'left join incident on incident.id = incidentgroups.incident_id ' +
                    'where user_id = ? and (notification.complete = 0 or TIMESTAMPDIFF(HOUR, notification.timesent, NOW()) <= 72) order by notification.complete, incident.datetime desc', [rows[0].id]);
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