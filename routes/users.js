module.exports = function(app, config, firebase_admin, router) {
    // var express = require('express');
    // var router = express.Router();
    const url = require('url');

    const mysql = require('mysql2/promise');

    router.post('/users/logout', async function (req, res, next) {
        const connection = await mysql.createConnection(config.dbConfig);
        const [rows, fields] = await connection.execute('delete from tokens where token = ?', [req.body.token]);
        connection.close();
        res.json({status: '1'});
    });

    async function getallusers (req, res, next) {
        const connection = await mysql.createConnection(config.dbConfig);
        const [rows, fields] = await connection.execute('select * from users order by name', []);
        connection.close();
        return await rows;
    }

    router.get('/users/getallusers', async function (req, res, next) {
        res.json(await getallusers());
    });

    router.get('/users/getADuser', function (req, res, next) {
        let ad = app.get('AD');
        let query = "(&(objectCategory=person)(objectClass=user)(displayName=*" + req.query.user + "*)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";
        // let query = "(displayName=*" + req.query.user + "*)";
        ad.findUsers(query, true, function(err, users) {
            if (err) {
                console.log('ERROR: ' +JSON.stringify(err));
                return;
            }

            res.json(users);
        });
    });

    router.post('/users/add', function (req, res, next) {
        let ad = app.get('AD');
        let query = "(&(objectCategory=person)(objectClass=user)(employeeID=*" + req.body.employeeID + "*)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";
        // let query = "(displayName=*" + req.query.user + "*)";
        ad.findUsers(query, true, async function(err, users) {
            if (err) {
                res.status(405).send({status: "false"});
                return;
            }
            const connection = await mysql.createConnection(config.dbConfig);
            await connection.execute('insert into users (name, login) values (?, ?) ON DUPLICATE KEY UPDATE login=login', [users[0].displayName, users[0].sAMAccountName]);
            connection.close();

            // res.status(200).send(await getallusers());
            res.status(200).send({status: "ok"});
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
                            const connection = await mysql.createConnection(config.dbConfig);
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
            const connection = await mysql.createConnection(config.dbConfig);
            const [rows, fields] = await connection.execute('select users.id, users.login, users.name from tokens left join users on users.id = tokens.user_id where tokens.token = ?', [req.query.token]);
            if (rows.length > 0 && rows[0] && rows[0].id) {
                const [rows1, fields1] = await connection.execute('select notification.id, notification.complete, incident.title, incident.description from notification ' +
                    'left join incidentgroups on notification.incidentGroup_id = incidentgroups.id ' +
                    'left join incident on incident.id = incidentgroups.incident_id ' +
                    'where user_id = ? and (notification.complete = 0 or TIMESTAMPDIFF(HOUR, notification.timesent, NOW()) <= 972) order by notification.complete, incident.datetime desc', [rows[0].id]);
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