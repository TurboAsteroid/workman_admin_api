let DataBase = require('../routes/db');

module.exports = function(app, config, firebase_admin, router) {
    const mysql = require('mysql2/promise');

    /* GET home page. */
    router.get('/getusers', async function (req, res, next) {
        //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
        const [user_rows, user_fields] = await DataBase.Execute("select Concat('user_', id) as value, name as text, id, 'user' as type from users order by users.name", []);
        const [group_rows, group_fields] = await DataBase.Execute("select Concat('group_', id) as value, name as text, id, 'group' as type from calendars order by calendars.name", []);
        let rows = user_rows.concat(group_rows);

        res.json(rows);
        //connection.end();
    });

    return router;
};