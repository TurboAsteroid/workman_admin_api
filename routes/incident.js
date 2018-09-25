module.exports = function(app, config, firebase_admin, router) {
    // var express = require('express');
    // var uniqid = require('uniqid');
    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');
    const url = require('url');
    const helper = require('./helper');

    async function addincident (group_id, incident_id) {
        const connection = await mysql.createConnection(mysql_config);

        // const [rows, fields] = await connection.execute('select MAX(row_number) as max_row from grouprows where group_id = ? group by group_id', [group_id]);
        // console.log("max_row", rows);

        await connection.execute('insert into incidentgroups (incident_id, group_id) values (?,?)', [incident_id, group_id]);
        connection.close();
    }
    async function showNewincident (res) {
        const connection = await mysql.createConnection(mysql_config);
        const [rows2, fields2] = await connection.execute('select * from Groups', []);
        connection.close();
        // res.render('incident/new', {
        //     title: 'Новый инцедент',
        //     groups: rows2
        // });
        res.status(200).json({status: "ok"});
    }

    // var router = express.Router();
    // router.get('/incident/new', function (req, res, next) {
    //     showNewincident(res);
    // });
    router.post('/incident/checknotification', function (req, res, next) {

        // console.log(req.body);
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            await connection.execute('update notification SET complete = 1, timecheck = NOW() where id = ?', [req.body.notification_id]);
            const [notR, notF] = await connection.execute('select incidentgroups.id as incidentgroup_id from notification left join incidentgroups on incidentgroups.id = notification.incidentGroup_id where notification.id = ?', [req.body.notification_id]);
            await connection.execute('update incidentgroups SET complete = 1 where id = ?', [notR[0].incidentgroup_id]);

            res.json({status: '1'});
            connection.close();
// console.warn(app.get('io'));
            app.get('io').emit('incidents', await helper.getAllIncidents(mysql_config));
        };
        result();
    });
    router.get('/incident/getbynotification', function (req, res, next) {
        let result = async function () {
            let notification_id = url.parse(req.url, true).query.notification_id;

            const connection = await mysql.createConnection(mysql_config);
            const [incR, incF] = await connection.execute('select incident.*, DATE_FORMAT(incident.datetime, "%H:%i:%S %d-%m-%Y") as time from notification ' +
                'left join incidentgroups on incidentgroups.id = notification.incidentGroup_id ' +
                'left join incident on incident.id = incidentgroups.incident_id ' +
                'where notification.id = ?', [notification_id]);
            res.json({
                title: incR[0].title,
                description: incR[0].description,
                datetime: incR[0].time,
                solution: "Здесь будут описаны возможные способы решения проблемы, а также необходимые контактные данные."
            });
            connection.close();
        };
        result();

    });
    router.get('/incident/getall', async function (req, res, next) {
        res.json(await helper.getAllIncidents(mysql_config));
    });

    // router.get('/socket', async function (req, res, next) {
    //     res.json(await helper.getAllIncidents(mysql_config));
    // });

    router.post('/incident/new', function (req, res, next) {
        let result = async function () {

            const connection = await mysql.createConnection(mysql_config);
            // const [rows2, fields2] = await connection.execute('select * from Groups where id in ('+req.body.groups.join(',')+')', []);
            const [rows2, fields2] = await connection.execute('insert into incident (title, description) values (?,?)', [req.body.title, req.body.description]);

            for(let i in req.body.groups) {
                addincident(req.body.groups[i], rows2.insertId);
            }

            showNewincident(res);

            app.get('io').emit('incidents', await helper.getAllIncidents(mysql_config));
            connection.close();
        };
        result();
    });

    return router;
};