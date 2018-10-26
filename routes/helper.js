const mysql = require('mysql2/promise');

const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    getColors : function () {
        return {
            "red": 'rgb(255, 40, 40)',
            "green": 'rgb(76, 175, 80)',
            "gray": 'rgb(181, 161, 161)',
            "orange": 'rgb(255, 137, 58)'
        };
    },
    getAllStatuses : function () {
        return {
            "incidents": {
                title: 'Статусы инцидента',
                statuses: {
                    "green": {text: 'Обработан', value: this.getColors().green},
                    "red": {text: 'Не обработан', value: this.getColors().red}
                }
            },
            "groups": {
                title: 'Статусы группы',
                statuses: {
                    "green": {text: 'Обработано', value: this.getColors().green},
                    "red": {text: 'Не обработано', value: this.getColors().red}
                }
            },
            "notifications": {
                title: 'Статусы уведомлений',
                statuses: {
                    "gray": {text: 'Не отправлено', value: this.getColors().gray},
                    "orange": {text: 'Отправлено', value: this.getColors().orange},
                    "red": {text: 'Получено', value: this.getColors().red},
                    "green": {text: 'Прочитано', value: this.getColors().green}
                }
            }
        };
    },
    getAllIncidents : async function (mysql_config, timestart, timeend, status, value) {
        const connection = await mysql.createConnection(mysql_config);
        let querystart = "", queryend = "", querystatus = "", queryvalue = "";

        if (timestart) {
            querystart = " AND incident.datetime > " + timestart + " "
        }
        if (timeend) {
            queryend = " AND incident.datetime < " + timeend + " "
        }
        if (status) {
            querystatus = " AND incident.id IN (select incidentgroups.incident_id from incidentgroups group by incidentgroups.incident_id having min(incidentgroups.complete) " + (status ? "" : "!") + "= 0) "
        }
        if (value) {
            queryvalue = " AND (incident.title like '%" + value + "%' OR incident.title like '%" + description + "%') "
        }

        const [rows, fields] = await connection.execute('select incident.*, incidentgroups.group_id, incidentgroups.complete, incidentgroups.time_sent, groups.name, incidentgroups.id as incidentgroup_id ' +
            'from incident ' +
            'left join incidentgroups on incidentgroups.incident_id = incident.id ' +
            'left join groups on incidentgroups.group_id = groups.id ' +
            'where 1=1 ' + querystart + queryend + querystatus + queryvalue, []);
        // const [Urows, Ufields] = await connection.execute('select * from grouprows left join grouprowusers on grouprowusers.row_id = grouprows.id left join users on grouprowusers.user_id = users.id');
        const [Urows, Ufields] = await connection.execute('select * from grouprows');
        const [Nrows, Nfields] = await connection.execute('select row_id, user_id, incidentgroup_id, max(timeget) as timeget, MIN(timecheck) as timecheck, Min(timesent) as timesent from notification group by incidentgroup_id, row_id, user_id');
        let rows_tmp = {};
        for (let j in Urows) {
            if (!rows_tmp[Urows[j].group_id]) {
                rows_tmp[Urows[j].group_id] = {};
            }
            if (!rows_tmp[Urows[j].group_id][Urows[j].row_number]) {
                rows_tmp[Urows[j].group_id][Urows[j].row_number] = {
                    row_number: Urows[j].row_number,
                    row_id: Urows[j].id,
                    users: []
                };
            }




            let rows_ids = [];
            Urows.forEach((row) => {
                rows_ids.push(row.id);
            });
            const [users_rows, users_fields] = await connection.execute(`select Concat('user_', user_id) as value, user_id as id, users.name as text, 'user' as type, grouprowusers.row_id from grouprowusers 
            left join users on users.id = grouprowusers.user_id 
            where grouprowusers.row_id in (${rows_ids.join(",")})`, []);
            const [calendar_rows, calendar_fields] = await connection.execute(`select Concat('group_', calendar_id) as value, calendar_id as id, calendars.name as text, 'group' as type, grouprowcalendars.row_id from grouprowcalendars
            left join calendars on calendars.id = grouprowcalendars.calendar_id 
            where grouprowcalendars.row_id in (${rows_ids.join(",")})`, []);
            let users = users_rows.concat(calendar_rows);
            users.forEach((user) => {
                if (user.row_id === Urows[j].id) {
                    rows_tmp[Urows[j].group_id][Urows[j].row_number].users.push({
                        value: user.value,
                        text: user.text,
                        type: user.type,
                        id: user.id
                    });
                }
            });
        }

        for (let m in rows_tmp) {
            let tmp = [];
            for (let n in rows_tmp[m]) {
                tmp.push(rows_tmp[m][n]);
            }
            rows_tmp[m] =  tmp;
        }

        // console.log(rows_tmp["1"][2]);


        let tmp_result = {};
        for (let i in rows) {
            if (!tmp_result[rows[i].id]) {
                let hash = crypto.createHash('md5').update(rows[i].id.toString()).digest("hex");
                let dirname = "./inc_files/" + hash + "/";
                let filesArray = [];

                if (await fs.existsSync(dirname)) {
                    filesArray = await fs.readdirSync(dirname);
                }


                tmp_result[rows[i].id] = {
                    id: rows[i].id,
                    name: rows[i].title,
                    description: rows[i].description,
                    importance: rows[i].importance,
                    datetime: rows[i].datetime,
                    // incidentgroup_id: rows[i].incidentgroup_id,
                    groups_t: [],
                    hash: hash,
                    files: filesArray
                };
            }
            tmp_result[rows[i].id].groups_t.push({
                id: rows[i].group_id,
                incidentgroup_id: rows[i].incidentgroup_id,
                complete: rows[i].complete ? this.getAllStatuses().notifications.statuses.green.value : this.getAllStatuses().notifications.statuses.red.value,
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

        result_array = JSON.stringify(result_array);
        result_array = JSON.parse(result_array);

        for (let n in result_array) {
            for (let m in result_array[n].groups) {
                for (let l in result_array[n].groups[m].rows) {
                    for (let k in result_array[n].groups[m].rows[l].users) {
                        for (let t in Nrows) {
                            if (
                                Nrows[t].incidentgroup_id === result_array[n].groups[m].incidentgroup_id &&
                                Nrows[t].row_id === result_array[n].groups[m].rows[l].row_id &&
                                Nrows[t].user_id === result_array[n].groups[m].rows[l].users[k].value
                            ) {
                                // console.log("Nrows[t]", Nrows[t]);
                                result_array[n].groups[m].rows[l].users[k].status =
                                    Nrows[t].timecheck ? this.getAllStatuses().notifications.statuses.green.value :
                                        (Nrows[t].timeget ? this.getAllStatuses().notifications.statuses.orange.value : (Nrows[t].timesent ? this.getAllStatuses().notifications.statuses.red.value : this.getAllStatuses().notifications.statuses.green.value));
                            }
                        }
                    }
                }
            }
        }

        // console.log(rows);
        connection.close();
        return result_array;
    }
};

