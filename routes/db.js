const mysql = require('mysql2/promise');
const config = require('../config');

let DataBase = function () {
};

module.exports = DataBase;

DataBase.GetDB = async function () {
    if (typeof DataBase.db === 'undefined') {
        await DataBase.InitDB()
    }
    return await DataBase.db;
};

DataBase.InitDB = async function () {
    // console.warn(new Date(), "/db.js", "InitDB");
    try {
        DataBase.db = await mysql.createConnection(config.dbConfig);

        DataBase.db.on('error', async function(err) {
            console.warn(new Date(), "/db.js", 'connection lost', err);
            await DataBase.Disconnect();
            await DataBase.InitDB();
        });
    } catch (exception) {
        console.warn(new Date(), "/db.js", "can't create connection", exception);
    }
};

DataBase.Disconnect = async function () {
    if (DataBase.db) {
        await DataBase.db.end();
    }
};


DataBase.Execute = async function (request, params) {
    try {
        let connection = await DataBase.GetDB();
        return await connection.execute(request, params);
    } catch (exception) {
        console.warn(new Date(), "/db.js", "can't execute request", exception, await DataBase.GetDB());
        return [];
    }
};
