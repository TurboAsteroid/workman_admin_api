let DataBase = require('../routes/db');

module.exports = function(app, config, firebase_admin, router) {

    const mysql = require('mysql2/promise');

    /* */
    router.patch('/groups/:id', async function (req, res) {
        let group_id = req.params.id;
        let name = req.body.name;

        //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
        await DataBase.Execute('update groups SET name = ? where id = ?', [name, group_id]);
        //connection.end();

        res.json({status: "ok"});
    });
    router.delete('/groups/:id', async function (req, res) {
        let group_id = req.params.id;

        //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
        await DataBase.Execute('delete from groups where id = ?', [group_id ]);
        //connection.end();

        res.json({status: "ok"});
    });
    router.get('/groups/get', async function (req, res) {
        console.log("!!!! ",config.dbConfig);
        //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
        const [grR, grF] = await DataBase.Execute('select tags_groups.id_groups as group_id, tags.text, tags.id from tags left join tags_groups on tags_groups.id_tags = tags.id where tags_groups.id_groups IS NOT NULL ', []);
        // const [rows1, fields1] = await DataBase.Execute('select grouprows.*, groups.name, user_id, users.name as user_name from groups ' +
        //     'left join grouprows on groups.id = grouprows.group_id ' +
        //     'left join grouprowusers on grouprows.id = grouprowusers.row_id ' +
        //     'left join users on users.id = grouprowusers.user_id ', []);
        const [rows1, fields1] = await DataBase.Execute('select grouprows.*, groups.name, groups.id as groupp_id from groups ' +
            'left join grouprows on groups.id = grouprows.group_id ', []);

        let tmp_result = {};
        for (let i in rows1) {
            if (!tmp_result[rows1[i].groupp_id]) {
                tmp_result[rows1[i].groupp_id] = {
                    id: rows1[i].groupp_id,
                    value: rows1[i].groupp_id,
                    name: rows1[i].name,
                    text: rows1[i].name,
                    tags: [],
                    data_t: {}
                };
            }

            if (rows1[i].row_number && rows1[i].row_number !== null && !tmp_result[rows1[i].groupp_id].data_t[rows1[i].row_number]) {
                tmp_result[rows1[i].groupp_id].data_t[rows1[i].row_number] = {
                    id: rows1[i].id,
                    row_number: rows1[i].row_number,
                    delay: rows1[i].delay,
                    users: []
                };
            }

            let rows_ids = [];
            rows1.forEach((row) => {
                if (row.id && row.id !== null) {
                    rows_ids.push(row.id);
                }
            });
            if (rows_ids.length) {
                const [users_rows, users_fields] = await DataBase.Execute(`select Concat('user_', user_id) as value, user_id as id, users.name as text, 'user' as type, grouprowusers.row_id from grouprowusers 
                    left join users on users.id = grouprowusers.user_id 
                    where grouprowusers.row_id in (${rows_ids.join(",")})`, []);
                const [calendar_rows, calendar_fields] = await DataBase.Execute(`select Concat('group_', calendar_id) as value, calendar_id as id, calendars.name as text, 'group' as type, grouprowcalendars.row_id from grouprowcalendars
                    left join calendars on calendars.id = grouprowcalendars.calendar_id 
                    where grouprowcalendars.row_id in (${rows_ids.join(",")})`, []);
                let users = users_rows.concat(calendar_rows);
                users.forEach((user) => {
                    if (user.row_id === rows1[i].id) {
                        tmp_result[rows1[i].groupp_id].data_t[rows1[i].row_number].users.push({
                            value: user.value,
                            text: user.text,
                            type: user.type,
                            id: user.id
                        });
                    }
                });
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
        //connection.end();
    });
    router.post('/groups/saveall', async function (req, res, next) {
        //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
        await DataBase.Execute('delete from tags_groups', []);
        await DataBase.Execute('delete from grouprowusers ', []);
        await DataBase.Execute('delete from grouprowcalendars ', []);
        for (let i in req.body) {
            let group = req.body[i];
            await DataBase.Execute('insert into groups (id, name) values (?, ?) ON DUPLICATE KEY UPDATE name = ?', [group.id, group.name, group.name]);
            for (let j in group.data) {
                let row = group.data[j];
                if (!row.users.length) {
                    break;
                }
                let ins_id;
                if (row.id) {
                    await DataBase.Execute('insert into grouprows (id, group_id, row_number, delay) values (?,?,?,?) ON DUPLICATE KEY UPDATE row_number = ?, delay = ?', [row.id, group.id, row.row_number, row.delay, row.row_number, row.delay]);
                    ins_id = row.id;
                } else {
                    const [GroupRows_res, GroupRows_fielsd] = await DataBase.Execute('insert into grouprows (group_id, row_number, delay) values (?,?,?)', [group.id, row.row_number, row.delay]);
                    ins_id = GroupRows_res.insertId;
                }

                for (let l in row.users) {
                    let user_id, type;
                    if (row.users[l] && row.users[l].id) {
                        user_id = row.users[l].id;
                        type = row.users[l].type;
                    } else if (typeof row.users[l] === 'string') {
                        [type, user_id] = row.users[l].split('_');
                        user_id = parseInt(user_id);
                    } else {
                        continue;
                    }
                    if (user_id && user_id !== null) {
                        switch (type) {
                            case "user":
                                await DataBase.Execute('insert into grouprowusers (user_id, row_id) values (?,?)', [user_id, ins_id]);
                                break;
                            case "group":
                                await DataBase.Execute('insert into grouprowcalendars (calendar_id, row_id) values (?,?)', [user_id, ins_id]);
                                break;
                        }
                    }
                }
            }
            await DataBase.Execute('delete from tags_groups where id_groups = ?', [group.id]);
            for (let j in group.tags) {
                await DataBase.Execute('insert into tags_groups (id_tags, id_groups) values (?,?)', [group.tags[j].value, group.id]);
            }
        }
        res.sendStatus(200);
        //connection.end();

    });

    /* Сохранение отдельной группы? искользуется? переделать без удаления */
    // router.post('/groups/save', async function (req, res, next) {
    //     let data = JSON.parse(req.body.data);
    //
    //      console.log("***");//const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
    //     // query database
    //     const [rows1, fields1] = await DataBase.Execute('delete from groups where name=?', [req.body.name]);
    //     const [rows2, fields2] = await DataBase.Execute('insert into groups (name) values (?)', [req.body.name]);
    //     console.warn("2rows, fields", rows2.insertId);
    //     let values = '';
    //
    //     for (let key in data) {
    //         let tmp = data[key];
    //         values += "(" + rows2.insertId + "," + key + "," + tmp.delay + "),";
    //     }
    //     values = values.substring(0, values.length - 1);
    //
    //
    //     const [rows3, fields3] = await DataBase.Execute('insert into grouprows (group_id, row_number, delay) values ' + values, []);
    //     const [rows4, fields4] = await DataBase.Execute('select * from grouprows where group_id = ?', [rows2.insertId]);
    //     let values2 = '';
    //     for (let k in rows4) {
    //         let row = rows4[k];
    //         for (let j in data[row.row_number].user_ids) {
    //             values2 += "(" + data[row.row_number].user_ids[j] + "," + row.id + "),";
    //         }
    //     }
    //     values2 = values2.substring(0, values2.length - 1);
    //     console.log(values2);
    //     const [rows5, fields5] = await DataBase.Execute('insert into grouprowusers (user_id, row_id) values ' + values2, []);
    //
    //     res.json({ok: 1});
    //     //connection.end();
    // });

    return router;
};