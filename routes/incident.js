module.exports = function(app, config, firebase_admin, router) {
    // var express = require('express');
    // var uniqid = require('uniqid');
    const mysql = require('mysql2/promise');
    const url = require('url');
    const helper = require('./helper');
    const crypto = require('crypto');
    const fs = require('fs');
    var formidable = require('formidable');

    async function addincident (group_id, incident_id) {
        const connection = await mysql.createConnection(config.dbConfig);

        // const [rows, fields] = await connection.execute('select MAX(row_number) as max_row from grouprows where group_id = ? group by group_id', [group_id]);
        // console.log("max_row", rows);

        await connection.execute('insert into incidentgroups (incident_id, group_id) values (?,?)', [incident_id, group_id]);
        connection.end();
    }

    // var router = express.Router();
    // router.get('/incident/new', function (req, res, next) {
    //     showNewincident(res);
    // });
    router.post('/incident/notificationstatus', async function (req, res, next) {
        const connection = await mysql.createConnection(config.dbConfig);
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
        connection.end();

        app.get('io').emit('incidents', await helper.getAllIncidents());
    });
    router.get('/incident/getbynotification', async function (req, res, next) {
        let notification_id = req.query.notification_id;

        const connection = await mysql.createConnection(config.dbConfig);
        const [incR, incF] = await connection.execute('select incident.*, DATE_FORMAT(incident.datetime, "%H:%i:%S %d-%m-%Y") as time from notification ' +
            'left join incidentgroups on incidentgroups.id = notification.incidentGroup_id ' +
            'left join incident on incident.id = incidentgroups.incident_id ' +
            'where notification.id = ?', [notification_id]);

        let dirname = "./inc_files/" + crypto.createHash('md5').update(incR[0].id.toString()).digest("hex") + "/";
        let filesArray = [];

        if (await fs.existsSync(dirname)) {
            filesArray = await fs.readdirSync(dirname);
        }
        res.json({
            title: incR[0].title,
            incident_id: incR[0].id.toString(),
            description: incR[0].description,
            datetime: incR[0].time,
            solution: "Здесь будут описаны возможные способы решения проблемы, а также необходимые контактные данные.",
            files: filesArray
        });
        connection.end();
    });
    router.get('/incident/getall', async function (req, res, next) {
        res.json(await helper.getAllIncidents());
    });

    // router.get('/socket', async function (req, res, next) {
    //     res.json(await helper.getAllIncidents(config.dbConfig));
    // });

    router.post('/incident/new', async function (req, res, next) {

        const connection = await mysql.createConnection(config.dbConfig);
        // const [rows2, fields2] = await connection.execute('select * from Groups where id in ('+req.body.groups.join(',')+')', []);
        const [rows2, fields2] = await connection.execute('insert into incident (title, description) values (?,?)', [req.body.title, req.body.description]);

        for(let i in req.body.groups) {
            addincident(req.body.groups[i], rows2.insertId);
        }
        res.status(200).json({status: "ok", insertedId: crypto.createHash('md5').update(rows2.insertId.toString()).digest("hex")}); // ответ клиенту
        app.get('io').emit('incidents', await helper.getAllIncidents());
        connection.end();
    });

    function attachFiles (req, res, path) {
        let form = new formidable.IncomingForm();
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
        const path = __dirname + `/../inc_files/${req.query.insertedId}/`;
        if (await fs.existsSync(path)) {
            console.log(`yes: ${path}`);
            attachFiles(req, res, path);
        } else {
            console.log(`no: ${path}`);
            await fs.mkdirSync(path, 0o770);
            attachFiles(req, res, path);
        }
    });
    return router;
};