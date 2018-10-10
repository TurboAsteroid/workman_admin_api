const mysql = require('mysql2/promise');

module.exports = {
    getAllIncidents : async function (mysql_config) {
        const connection = await mysql.createConnection(mysql_config);
        const [rows, fields] = await connection.execute('select incident.*, incidentgroups.group_id, incidentgroups.complete, incidentgroups.time_sent, groups.name, incidentgroups.id as incidentgroup_id ' +
            'from incident ' +
            'left join incidentgroups on incidentgroups.incident_id = incident.id ' +
            'left join groups on incidentgroups.group_id = groups.id', []);
        const [Urows, Ufields] = await connection.execute('select * from grouprows left join grouprowusers on grouprowusers.row_id = grouprows.id left join users on grouprowusers.user_id = users.id');
        const [Nrows, Nfields] = await connection.execute('select row_id, user_id, incidentgroup_id, max(timeget) as timeget, MIN(timecheck) as timecheck, Min(timesent) as timesent from notification group by incidentgroup_id, row_id, user_id');
        let rows_tmp = {};
        for (let j in Urows) {
            if (!rows_tmp[Urows[j].group_id]) {
                rows_tmp[Urows[j].group_id] = {};
            }
            if (!rows_tmp[Urows[j].group_id][Urows[j].row_number]) {
                rows_tmp[Urows[j].group_id][Urows[j].row_number] = {
                    row_number: Urows[j].row_number,
                    row_id: Urows[j].row_id,
                    users: []
                };
            }
            rows_tmp[Urows[j].group_id][Urows[j].row_number].users.push({
                value: Urows[j].user_id,
                text: Urows[j].name,
                status: "gray"
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
                tmp_result[rows[i].id] = {
                    id: rows[i].id,
                    name: rows[i].title,
                    description: rows[i].description,
                    importance: rows[i].importance,
                    datetime: rows[i].datetime,
                    // incidentgroup_id: rows[i].incidentgroup_id,
                    groups_t: []
                };
            }
            tmp_result[rows[i].id].groups_t.push({
                id: rows[i].group_id,
                incidentgroup_id: rows[i].incidentgroup_id,
                complete: rows[i].complete ? 'green' : 'red',
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
                                Nrows[t].incidentGroup_id === result_array[n].groups[m].incidentgroup_id &&
                                Nrows[t].row_id === result_array[n].groups[m].rows[l].row_id &&
                                Nrows[t].user_id === result_array[n].groups[m].rows[l].users[k].value
                            ) {
                                result_array[n].groups[m].rows[l].users[k].status = Nrows[t].timecheck ? "green" : (Nrows[t].timeget ? "yellow" : (Nrows[t].timesent ? "orange" : "gray"));
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

