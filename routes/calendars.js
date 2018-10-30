module.exports = function(app, config, router) {
    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');

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
console.warn(events_req);
        const connection = await mysql.createConnection(mysql_config);
        await connection.execute('delete from calendars_users where calendar_id = ?', [calendar_id]);
        if (users_req.length) {await connection.execute('insert into calendars_users (user_id, calendar_id) values ' + users_req.join(","), []);}
        await connection.execute('delete from calendars_events where calendar_id = ?', [calendar_id]);
        if (events_req.length) {await connection.execute('insert into calendars_events (calendar_id, user_id, text, start, end) values ' + events_req.join(","), []);}
        connection.close();

        res.json({status: "ok"});
    });
    router.get('/calendar/:calendar_id', async function (req, res, next) {
        let calendar_id = req.params.calendar_id;
        const connection = await mysql.createConnection(mysql_config);
        const [users_rows, users_fields] = await connection.execute('select users.id, users.name from calendars_users left join users on calendars_users.user_id = users.id where calendars_users.calendar_id = ? ', [calendar_id]);
        const [events_rows, events_fields] = await connection.execute('select *, calendars_events.user_id as resource from calendars_events where calendars_events.calendar_id = ? ', [calendar_id]);
        connection.close();

        let options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        events_rows.forEach((val) => {
            val.start = new Date(val.start).toLocaleDateString('ru-Ru',options);
            val.end = new Date(val.end).toLocaleDateString('ru-Ru',options);
        });

        let result = {
            "resources" : users_rows,
            "events"    : events_rows
        };

        res.json(result);
    });

    router.get('/calendar/', async function (req, res, next) {
        const connection = await mysql.createConnection(mysql_config);
        const [calendars_rows, calendars_fields] = await connection.execute('select * from calendars ', []);
        connection.close();
        res.json(calendars_rows);
    });

    return router;
};