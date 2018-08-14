module.exports = function(app) {
    var express = require('express');
    var router = express.Router();

    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');

    router.get('/get', async function (req, res, next) {
        const connection = await mysql.createConnection(mysql_config);
        const [rows0, fields0] = await connection.execute(`select id from groups`);
        const tagsSelected = rows0;
        const [rows1, fields1] = await connection.execute(`select tags.id as value, tags.text from tags`);
        const [rows2, fields2] = await connection.execute(
            `
                select tags.id as value, tags.text, groups.id as value_gr
                from tags
                join tags_groups on tags_groups.id_tags = tags.id
                join groups on groups.id = tags_groups.id_groups
            `
        );
        let json = new Array(tagsSelected.length);
        for (var i = 0; i < tagsSelected.length; i++) {
            for (var j = 0; j < rows2.length; j++) {
                if(rows2[j].value_gr === tagsSelected[i].id) {
                    if (json[i] === undefined) {
                        json[i] = [rows2[j]]
                    } else {
                        json[i].push(rows2[j])
                    }
                }
            }
        }
        for (var i = 0; i < json.length; i++) {
            json[i] = { id: json[i][0].value_gr, data: json[i] }
        }
        res.json({ tags: rows1, tagsSelected: json});
    });

    return router;
};