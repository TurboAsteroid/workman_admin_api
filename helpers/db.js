const mysql = require('mysql2/promise')
const config = require('../config')

const db = {
  connection: null,
  connect: async function () {
    try {
      this.connection = await mysql.createConnection(config.mariadb)

      return 0
    } catch (err) {
      console.error(`db. function connect error. ${err.message}`)
    }
    return 1
  },
  q: async function (query, params) {
    try {
      await this.connection.query('select 1 as alive')
    } catch (err) {
      await this.connect()
      return this.q(query, params)
    }
    return this.connection.query(query, params)
  },
  r: async function (query, params) {
    try {
      await this.connection.query('select 1 as alive')
    } catch (err) {
      await this.connect()
      return this.q(query, params)
    }
    return this.connection.execute(query, params)
  }
}
module.exports = db
