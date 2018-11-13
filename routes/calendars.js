module.exports = function(app, config, router) {
    const mysql = require('mysql2/promise');
    const moment = require('moment');


    router.post('/calendar/:calendar_id', async function (req, res, next) {
        let calendar_id = req.params.calendar_id;
        let users_req = [];
        for (let i in req.body.resources) {
            users_req.push("(" + req.body.resources[i].id + ',' + calendar_id + ')');
        }
        let events_req = [];
        for (let i in req.body.events) {
            events_req.push("(" +
                calendar_id
                + ',' + req.body.events[i].resource
                + ',"' + req.body.events[i].text + '"'
                + ',"' + req.body.events[i].start + '"'
                + ',"' + req.body.events[i].end + '"'
                + ')');
        }
        const connection = await mysql.createConnection(config.dbConfig);
        await connection.execute('delete from calendars_users where calendar_id = ?', [calendar_id]);
        if (users_req.length) {await connection.execute('insert into calendars_users (user_id, calendar_id) values ' + users_req.join(","), []);}
        await connection.execute('delete from calendars_events where calendar_id = ?', [calendar_id]);
        if (events_req.length) {await connection.execute('insert into calendars_events (calendar_id, user_id, text, start, end) values ' + events_req.join(","), []);}
        if (req.body.name && req.body.name.length) {
            await connection.execute('UPDATE calendars SET name = ? WHERE id = ?', [req.body.name, calendar_id]);
        }
        connection.end();

        res.json({status: "ok"});
    });
    router.delete('/calendar/:calendar_id', async function (req, res, next) {
        let calendar_id = req.params.calendar_id;
        const connection = await mysql.createConnection(config.dbConfig);
        await connection.execute('delete from calendars where calendars.id = ? ', [calendar_id]);
        connection.end();
        res.json({status: "ok"});
    });
    router.get('/calendar/:calendar_id', async function (req, res, next) {
        let calendar_id = req.params.calendar_id;
        const connection = await mysql.createConnection(config.dbConfig);
        const [calendar_row, calendar_fields] = await connection.execute('select name from calendars where id = ? ', [calendar_id]);
        const [users_rows, users_fields] = await connection.execute('select users.id, users.name from calendars_users left join users on calendars_users.user_id = users.id where calendars_users.calendar_id = ? ', [calendar_id]);
        const [events_rows, events_fields] = await connection.execute('select *, calendars_events.user_id as resource from calendars_events where calendars_events.calendar_id = ? ', [calendar_id]);
        connection.end();

        events_rows.forEach((val) => {
            val.start = moment(val.start).format("YYYY.MM.DD HH:mm:ss");
            val.end = moment(val.end).format("YYYY.MM.DD HH:mm:ss");
        });

        let result = {
            "name" : calendar_row[0].name,
            "resources" : users_rows,
            "events"    : events_rows
        };

        res.json(result);
    });

    router.get('/calendar/', async function (req, res, next) {
        const connection = await mysql.createConnection(config.dbConfig);
        const [calendars_rows, calendars_fields] = await connection.execute('select * from calendars ', []);
        connection.end();
        res.json(calendars_rows);
    });
    router.post('/calendar/', async function (req, res, next) {
        let name = req.body.name;
        if(req.body.name) {
            const connection = await mysql.createConnection(config.dbConfig);
            const [calendars_rows, calendars_fields] = await connection.execute(`insert into calendars (\`name\`) values ('${name}')`, []);
            connection.end();
            res.json({status: "ok", id: calendars_rows.insertId});
        } else {
            res.json({status: "fail"});
        }
    });

    return router;
};