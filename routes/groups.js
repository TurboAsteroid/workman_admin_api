module.exports = function(app, config, firebase_admin, router) {

    const mysql = require('mysql2/promise');
    const mysql_config = app.get('mysql_config');

    /* */
    router.get('/groups/get', async function (req, res) {
        const connection = await mysql.createConnection(mysql_config);
        const [grR, grF] = await connection.execute('select tags_groups.id_groups as group_id, tags.text, tags.id from tags left join tags_groups on tags_groups.id_tags = tags.id where tags_groups.id_groups IS NOT NULL ', []);
        console.log(grR);
        const [rows1, fields1] = await connection.execute('select grouprows.*, groups.name, user_id, users.name as user_name from groups ' +
            'left join grouprows on groups.id = grouprows.group_id ' +
            'left join grouprowusers on grouprows.id = grouprowusers.row_id ' +
            'left join users on users.id = grouprowusers.user_id ', []);

        let tmp_result = {};
        for (let i in rows1) {
            if (!tmp_result[rows1[i].group_id]) {
                tmp_result[rows1[i].group_id] = {
                    id: rows1[i].group_id,
                    value: rows1[i].group_id,
                    name: rows1[i].name,
                    text: rows1[i].name,
                    tags: [],
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
            for (let j in grR) {
                if (tmp.value && tmp.value == grR[j].group_id) {
                    tmp_result[tmp.value].tags.push({value: grR[j].id, text: grR[j].text});
                }
            }

            result_array.push(tmp);
        }

        res.json(result_array);
        connection.close();
    });
    router.post('/groups/saveall', function (req, res, next) {
        let data = req.body;
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            await connection.execute('delete from tags_groups', []);
            await connection.execute('delete from groups', []);
            await connection.execute('delete from grouprows ', []);
            await connection.execute('delete from grouprowusers ', []);
            for (let i in req.body) {
                let group = req.body[i];
                await connection.execute('insert into Groups (id, name) values (?, ?)', [group.id, group.name]);
                for (let j in group.data) {
                    let row = group.data[j];
                    console.warn(row.users);
                    if (!row.users.length) {
                        break;
                    }
                    const [GroupRows_res, GroupRows_fielsd] = await connection.execute('insert into grouprows (group_id, row_number, delay) values (?,?,?)', [group.id, row.row_number, row.delay]);
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
                        await connection.execute('insert into grouprowusers (user_id, row_id) values (?,?)', [user_id, ins_id]);
                    }
                }
                await connection.execute('delete from tags_groups where id_groups = ?', [group.id]);
                for (let j in group.tags) {
                    await connection.execute('insert into tags_groups (id_tags, id_groups) values (?,?)', [group.tags[j].value, group.id]);
                }
            }
            res.sendStatus(200);
            connection.close();
        };
        result();
    });
    router.post('/groups/save', function (req, res, next) {
        let data = JSON.parse(req.body.data);
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            // query database
            const [rows1, fields1] = await connection.execute('delete from groups where name=?', [req.body.name]);
            const [rows2, fields2] = await connection.execute('insert into groups (name) values (?)', [req.body.name]);
            console.warn("2rows, fields", rows2.insertId);
            let values = '';

            for (let key in data) {
                let tmp = data[key];
                values += "(" + rows2.insertId + "," + key + "," + tmp.delay + "),";
            }
            values = values.substring(0, values.length - 1);


            const [rows3, fields3] = await connection.execute('insert into grouprows (group_id, row_number, delay) values ' + values, []);
            const [rows4, fields4] = await connection.execute('select * from grouprows where group_id = ?', [rows2.insertId]);
            let values2 = '';
            for (let k in rows4) {
                let row = rows4[k];
                for (let j in data[row.row_number].user_ids) {
                    values2 += "(" + data[row.row_number].user_ids[j] + "," + row.id + "),";
                }
            }
            values2 = values2.substring(0, values2.length - 1);
            console.log(values2);
            const [rows5, fields5] = await connection.execute('insert into grouprowusers (user_id, row_id) values ' + values2, []);

            res.json({ok: 1});
            connection.close();

        };
        result();
    });

    return router;
};