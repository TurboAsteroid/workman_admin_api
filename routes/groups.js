module.exports = function(app, config, firebase_admin) {
    var express = require('express');
    var router = express.Router();

    const mysql = require('mysql2/promise');
    const mysql_config = app.get('mysql_config');

    /* */
    router.get('/get', function (req, res, next) {
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows1, fields1] = await connection.execute('select grouprows.*, groups.name, user_id, users.name as user_name from groups ' +
                'left join grouprows on groups.id = grouprows.group_id ' +
                'left join grouprowusers on grouprows.id = grouprowusers.row_id ' +
                'left join users on users.id = grouprowusers.user_id', []);

            let tmp_result = {};
            for (let i in rows1) {
                if (!tmp_result[rows1[i].group_id]) {
                    tmp_result[rows1[i].group_id] = {
                        id: rows1[i].group_id,
                        value: rows1[i].group_id,
                        name: rows1[i].name,
                        text: rows1[i].name,
                        data_t: {}
                    };
                }
                if (!tmp_result[rows1[i].group_id].data_t[rows1[i].row_number]) {
                    tmp_result[rows1[i].group_id].data_t[rows1[i].row_number] = {
                        row_number: rows1[i].row_number,
                        delay: rows1[i].delay,
                        users: [{
                            value: rows1[i].user_id,
                            text: rows1[i].user_name
                        }]
                    }
                } else {
                    tmp_result[rows1[i].group_id].data_t[rows1[i].row_number].users.push({value: rows1[i].user_id, text: rows1[i].user_name});
                }
            }
            let result_array = [];
            for (let i in tmp_result) {
                let tmp = tmp_result[i];
                tmp.data = [];
                for (let j in tmp_result[i].data_t) {
                    tmp.data.push(tmp_result[i].data_t[j]);
                }
                delete tmp.data_t;
                result_array.push(tmp);
            }

            res.json(result_array);
            connection.close();
        };
        result();
    });
    router.post('/saveall', function (req, res, next) {
        let data = req.body;
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            await connection.execute('delete from tags_groups', []);
            await connection.execute('delete from Groups', []);
            await connection.execute('delete from grouprows ', []);
            await connection.execute('delete from grouprowusers ', []);
            for (let i in req.body) {
                let group = req.body[i];
                await connection.execute('insert into Groups (id, name) values (?, ?)', [group.id, group.name]);
                for (let j in group.data) {
                    let row = group.data[j];
                    const [GroupRows_res, GroupRows_fielsd] = await connection.execute('insert into GroupRows (group_id, row_number, delay) values (?,?,?)', [group.id, row.row_number, row.delay]);
                    let ins_id = GroupRows_res.insertId;

                    for (let l in row.users) {
                        let user_id;
                        if (row.users[l] && row.users[l].value) {
                            user_id = row.users[l].value;
                        } else if (Number.isInteger(row.users[l])) {
                            user_id = parseInt(row.users[l]);
                        } else {
                            continue;
                        }
                        // console.log(row.users[l].value );
                        await connection.execute('insert into GroupRowUsers (user_id, row_id) values (?,?)', [user_id, ins_id]);
                    }
                }
            }
            res.sendStatus(200);
            connection.close();
        };
        result();
    });
    router.post('/save', function (req, res, next) {
        let data = JSON.parse(req.body.data);
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            // query database
            const [rows1, fields1] = await connection.execute('delete from Groups where name=?', [req.body.name]);
            const [rows2, fields2] = await connection.execute('insert into Groups (name) values (?)', [req.body.name]);
            console.warn("2rows, fields", rows2.insertId);
            let values = '';

            for (let key in data) {
                let tmp = data[key];
                values += "(" + rows2.insertId + "," + key + "," + tmp.delay + "),";
            }
            values = values.substring(0, values.length - 1);


            const [rows3, fields3] = await connection.execute('insert into GroupRows (group_id, row_number, delay) values ' + values, []);
            const [rows4, fields4] = await connection.execute('select * from GroupRows where group_id = ?', [rows2.insertId]);
            let values2 = '';
            for (let k in rows4) {
                let row = rows4[k];
                for (let j in data[row.row_number].user_ids) {
                    values2 += "(" + data[row.row_number].user_ids[j] + "," + row.id + "),";
                }
            }
            values2 = values2.substring(0, values2.length - 1);
            console.log(values2);
            const [rows5, fields5] = await connection.execute('insert into GroupRowUsers (user_id, row_id) values ' + values2, []);

            res.json({ok: 1});
            connection.close();

        };
        result();
    });

    /*  */
    router.get('/new', function (req, res, next) {
        res.render('groups/new', {title: 'Новая группа'});
    });

    return router;
};