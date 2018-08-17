module.exports = function(app, config, router) {
    // let express = require('express');
    // let router = express.Router();

    const mysql_config = {
        user:  config.dbUser,
        password: config.dbPassword,
        host: config.dbHost,
        database: config.dbDatabase,
    };
    const mysql = require('mysql2/promise');

    router.get('/tags/get', async function (req, res, next) {
        const connection = await mysql.createConnection(mysql_config);
        // const [rows0, fields0] = await connection.execute(`select id from groups`);
        // const tagsSelected = rows0;
        const [rows1, fields1] = await connection.execute(`select tags.id as value, tags.text from tags`);
        // const [rows2, fields2] = await connection.execute(
        //     `
        //         select tags.id as value, tags.text, groups.id as value_gr
        //         from tags
        //         join tags_groups on tags_groups.id_tags = tags.id
        //         join groups on groups.id = tags_groups.id_groups
        //     `
        // );
        // let json_tmp = [];
        // let json = [];
        // for (let i in tagsSelected) {
        //     for (let j in rows2) {
        //         if(rows2[j].value_gr === tagsSelected[i].id) {
        //             if (json_tmp[i] === undefined) {
        //                 json_tmp[i] = [rows2[j]]
        //             } else {
        //                 json_tmp[i].push(rows2[j])
        //             }
        //         }
        //     }
        // }
        // for (let i in json_tmp) {
        //     json.push(
        //         {
        //             id: json[i][0].value_gr,
        //             data: json[i]
        //         });
        // }
        res.json(rows1);

        connection.close();
    });

    return router;
};