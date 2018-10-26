module.exports = function(app, config, firebase_admin, router) {
    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');

    /* GET home page. */
    router.get('/getusers', async function (req, res, next) {
        const connection = await mysql.createConnection(mysql_config);
        const [user_rows, user_fields] = await connection.execute("select Concat('user_', id) as value, name as text, id, 'user' as type from users order by users.name", []);
        const [group_rows, group_fields] = await connection.execute("select Concat('group_', id) as value, name as text, id, 'group' as type from calendars order by calendars.name", []);
        let rows = user_rows.concat(group_rows);

        res.json(rows);
        connection.close();
    });

    return router;
};