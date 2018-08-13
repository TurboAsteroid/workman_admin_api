module.exports = function(app, config, firebase_admin) {
    var express = require('express');
    // var uniqid = require('uniqid');
    const mysql_config = app.get('mysql_config');
    const mysql = require('mysql2/promise');

    async function addIncedent (group_id, incedent_id) {
        const connection = await mysql.createConnection(mysql_config);

        // const [rows, fields] = await connection.execute('select MAX(row_number) as max_row from grouprows where group_id = ? group by group_id', [group_id]);
        // console.log("max_row", rows);
        return await connection.execute('insert into incedentGroups (incedent_id, group_id) values (?,?)', [incedent_id, group_id]);
    }
    async function showNewIncedent (res) {
        const connection = await mysql.createConnection(mysql_config);
        const [rows2, fields2] = await connection.execute('select * from Groups', []);
        // res.render('incedent/new', {
        //     title: 'Новый инцедент',
        //     groups: rows2
        // });
        res.json({status: "ok"});
    }

    var router = express.Router();
    router.get('/new', function (req, res, next) {
        showNewIncedent(res);
    });
    router.get('/getall', function (req, res, next) {
        let result = async function () {
            const connection = await mysql.createConnection(mysql_config);
            const [rows, fields] = await connection.execute('select incedent.*, incedentgroups.group_id, incedentgroups.complete, incedentgroups.time_sent, groups.name ' +
            'from incedent ' +
                'left join incedentgroups on incedentgroups.incedent_id = incedent.id ' +
                'left join groups on incedentgroups.group_id = groups.id  ', []);
            const [Urows, Ufields] = await connection.execute('select * from grouprows left join grouprowusers on grouprowusers.row_id = grouprows.id left join users on grouprowusers.user_id = users.id');
            let rows_tmp = {};
            for (let j in Urows) {
                if (!rows_tmp[Urows[j].group_id]) {
                    rows_tmp[Urows[j].group_id] = {};
                }
                if (!rows_tmp[Urows[j].group_id][Urows[j].row_number]) {
                    rows_tmp[Urows[j].group_id][Urows[j].row_number] = {
                        row_number: Urows[j].row_number,
                        users: []
                    };
                }
                rows_tmp[Urows[j].group_id][Urows[j].row_number].users.push({value: Urows[j].user_id, text: Urows[j].name});
            }
            for (let m in rows_tmp) {
                let tmp = [];
                for (let n in rows_tmp[m]) {
                    tmp.push(rows_tmp[m][n]);
                }
                rows_tmp[m] = tmp;
            }
            let tmp_result = {};
            for (let i in rows) {
                if (!tmp_result[rows[i].id]) {
                    tmp_result[rows[i].id] = {
                        id: rows[i].id,
                        name: rows[i].title,
                        description: rows[i].description,
                        importance: rows[i].importance,
                        datetime: rows[i].datetime,
                        groups_t: []
                    };
                }
                tmp_result[rows[i].id].groups_t.push({
                    id: rows[i].group_id,
                    complete: rows[i].complete,
                    name: rows[i].name,
                    rows: rows_tmp[rows[i].group_id]
                });
            }

            let result_array = [];
            for (let i in tmp_result) {
                let tmp = tmp_result[i];
                tmp.groups = [];
                for (let j in tmp_result[i].groups_t) {
                    tmp.groups.push(tmp_result[i].groups_t[j]);
                }
                delete tmp.groups_t;
                result_array.push(tmp);
            }

            // console.log(rows);
            res.json(result_array);
        };
        result();
    });

    router.post('/new', function (req, res, next) {
        console.log('req.body', req.body);
        let result = async function () {

            const connection = await mysql.createConnection(mysql_config);
            // const [rows2, fields2] = await connection.execute('select * from Groups where id in ('+req.body.groups.join(',')+')', []);
            const [rows2, fields2] = await connection.execute('insert into incedent (title, description) values (?,?)', [req.body.title, req.body.description]);


            if (Array.isArray(req.body.groups)) {
                for(let i in req.body.groups) {
                    addIncedent(req.body.groups[i], rows2.insertId);
                }
            } else {
                addIncedent(req.body.groups, rows2.insertId);
            }


            showNewIncedent(res);
        };
        result();
    });

    return router;
};