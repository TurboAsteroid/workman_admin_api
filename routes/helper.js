let DataBase = require('../routes/db');

const mysql = require('mysql2/promise');

const crypto = require('crypto');
const fs = require('fs');
const config = require('../config');
const moment = require('moment');

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
                    "green": {
                        text: 'Обработан',
                        value: this.getColors().green,
                        key: 1
                    },
                    "red": {
                        text: 'Не обработан',
                        value: this.getColors().red,
                        key: 0
                    }
                }
            },
            "groups": {
                title: 'Статусы группы',
                statuses: {
                    "green": {
                        text: 'Обработано',
                        value: this.getColors().green,
                        key: 1
                    },
                    "red": {
                        text: 'Не обработано',
                        value: this.getColors().red,
                        key: 0
                    }
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
    getAllIncidents : async function (timestart, timeend, status, val) {
        try {
            //const connection = await DataBase.GetDB();// const connection = await mysql.createConnection(config.dbConfig);
            let querystart = "", queryend = "", querystatus = "", queryvalue = "";

            if (timestart) {
                querystart = ' AND incident.datetime > "' + timestart + '" ';
            }
            if (timeend) {
                queryend = ' AND incident.datetime < "' + moment(timeend).add(1, 'day').format("YYYY-MM-DD") + '" ';
            }
            if (status) {
                querystatus = " AND incident.id IN (select incidentgroups.incident_id from incidentgroups group by incidentgroups.incident_id having min(incidentgroups.complete) " + (status[0].key ? "" : "!") + "= 0) "
            }
            if (val) {
                queryvalue = " AND (incident.title like '%" + val + "%' OR incident.description like '%" + val + "%') "
            }
            const [rows, fields] = await DataBase.Execute('select incident.*, incidentgroups.group_id, incidentgroups.complete, incidentgroups.time_sent, groups.name, incidentgroups.id as incidentgroup_id ' +
                'from incident ' +
                'left join incidentgroups on incidentgroups.incident_id = incident.id ' +
                'left join groups on incidentgroups.group_id = groups.id ' +
                'where 1=1 ' + querystart + queryend + querystatus + queryvalue, []);
            // const [Urows, Ufields] = await DataBase.Execute('select * from grouprows left join grouprowusers on grouprowusers.row_id = grouprows.id left join users on grouprowusers.user_id = users.id');
            const [Urows, Ufields] = await DataBase.Execute('select * from grouprows');
            // const [calendar_rows, calendar_fields] = await DataBase.Execute('select * from calendars_events left join users on calendars_events.user_id = users.id');
            const [Nrows, Nfields] = await DataBase.Execute('select row_id, user_id, incidentgroup_id, max(timeget) as timeget, MIN(timecheck) as timecheck, Min(timesent) as timesent, user_type, calendar_id from notification group by incidentgroup_id, row_id, user_id');
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
                const [users_rows, users_fields] = await DataBase.Execute(`select Concat('user_', user_id) as value, user_id as id, users.name as text, 'user' as type, grouprowusers.row_id from grouprowusers 
            left join users on users.id = grouprowusers.user_id 
            where grouprowusers.row_id in (${rows_ids.join(",")})`, []);
                const [calendar_rows, calendar_fields] = await DataBase.Execute(`select Concat('group_', calendar_id) as value, calendar_id as id, calendars.name as text, 'group' as type, grouprowcalendars.row_id from grouprowcalendars
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
                rows_tmp[m] = tmp;
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
                                // console.log(result_array[n].groups[m].rows[l].users);
                                // console.log(Nrows[t]);
                                // if (result_array[n].groups[m].rows[l].users[k].type === "user") {
                                if (Nrows[t].user_type === result_array[n].groups[m].rows[l].users[k].type &&
                                    Nrows[t].incidentgroup_id === result_array[n].groups[m].incidentgroup_id &&
                                    Nrows[t].row_id === result_array[n].groups[m].rows[l].row_id &&
                                    (
                                        (Nrows[t].user_type === "group" && Nrows[t].calendar_id === result_array[n].groups[m].rows[l].users[k].id) ||
                                        (Nrows[t].user_type === "user" && Nrows[t].user_id === result_array[n].groups[m].rows[l].users[k].id)
                                    )
                                ) {
                                    result_array[n].groups[m].rows[l].users[k].status =
                                        Nrows[t].timecheck ? this.getAllStatuses().notifications.statuses.green.value :
                                            (Nrows[t].timeget ? this.getAllStatuses().notifications.statuses.orange.value : (Nrows[t].timesent ? this.getAllStatuses().notifications.statuses.red.value : this.getAllStatuses().notifications.statuses.gray.value));
                                }
                            }
                        }
                    }
                }
            }

            // console.log(rows);
            //connection.end();
            // console.warn(result_array);
            return result_array;
        } catch (e) {
            console.log(new Date() + ' :!:::: ' + e)
            return [];
        }
    }
};

