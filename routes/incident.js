module.exports = function(app, config, firebase_admin, router) {
    // var express = require('express');
    // var uniqid = require('uniqid');
    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');
    const url = require('url');
    const helper = require('./helper');
    const crypto = require('crypto');
    const fs = require('fs');
    var formidable = require('formidable');

    async function addincident (group_id, incident_id) {
        const connection = await mysql.createConnection(mysql_config);

        // const [rows, fields] = await connection.execute('select MAX(row_number) as max_row from grouprows where group_id = ? group by group_id', [group_id]);
        // console.log("max_row", rows);

        await connection.execute('insert into incidentgroups (incident_id, group_id) values (?,?)', [incident_id, group_id]);
        connection.close();
    }

    // var router = express.Router();
    // router.get('/incident/new', function (req, res, next) {
    //     showNewincident(res);
    // });
    router.post('/incident/notificationstatus', async function (req, res, next) {

        const connection = await mysql.createConnection(mysql_config);
        console.warn(req.body);

        switch (req.body.status) {
            case "checked":
                await connection.execute('update notification SET complete = 1, timecheck = NOW() where id = ?', [req.body.notification_id]);
                const [notR, notF] = await connection.execute('select incidentgroups.id as incidentgroup_id from notification left join incidentgroups on incidentgroups.id = notification.incidentGroup_id where notification.id = ?', [req.body.notification_id]);
                await connection.execute('update incidentgroups SET complete = 1 where id = ?', [notR[0].incidentgroup_id]);
                break;
            case "received":
                await connection.execute('update notification SET timeget = NOW() where id = ?', [req.body.notification_id]);
                break;
            default:
                console.warn("Не верный статус", req.body.status);
                break;
        }

        res.json({status: '1'});
        connection.close();

        app.get('io').emit('incidents', await helper.getAllIncidents(mysql_config));
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

    router.post('/incident/new', async function (req, res, next) {

        const connection = await mysql.createConnection(mysql_config);
        // const [rows2, fields2] = await connection.execute('select * from Groups where id in ('+req.body.groups.join(',')+')', []);
        const [rows2, fields2] = await connection.execute('insert into incident (title, description) values (?,?)', [req.body.title, req.body.description]);

        for(let i in req.body.groups) {
            addincident(req.body.groups[i], rows2.insertId);
        }
        res.status(200).json({status: "ok", insertedId: crypto.createHash('md5').update(rows2.insertId.toString()).digest("hex")}); // ответ клиенту
        app.get('io').emit('incidents', await helper.getAllIncidents(mysql_config));
        connection.close();
    });

    function attachFiles (req, res, path) {
        var form = new formidable.IncomingForm();
        form.parse(req);
        form.on('fileBegin', function (name, file){
            file.path = path + file.name;
        });
        form.on('file', function (name, file){
            console.log('Uploaded ' + file.name);
        });
        res.status(200).send({status: "ok"})
    }
    router.post('/incident/attachFiles', async function (req, res) {
        const path = __dirname + `/../inc_files/${req.query.insertedId}/`
        if (await fs.existsSync(path)) {
            console.log(`yes: ${path}`)
            attachFiles(req, res, path)
        } else {
            console.log(`no: ${path}`)
            await fs.mkdirSync(path, 0o770)
            attachFiles(req, res, path)
        }
    })
    return router;
};