module.exports = function(app, config, firebase_admin, router) {
    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');

    /* GET home page. */
    router.get('/getusers', function (req, res, next) {
        let getusers = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select name as text, id as value from users order by users.name', []);
            res.json(rows);
            connection.close();
        };
        getusers();
    });

    return router;
};