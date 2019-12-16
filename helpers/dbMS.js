const mssql = require('mssql')
const config = require('../config')

const dbMS = {
  q: async function (query, params) {
    try {
      let pool = await new mssql.ConnectionPool(config.kisdb).connect()
      let request = await pool.request()

      for (let p in params) {
        request.input(p, params[p])
      }
      let result = await request.query(query)
      await pool.close()

      return result.recordset
    } catch (err) {
      console.error('SQL error', err)
    }
  },
  cloth: async function (query, params) {
    try {
      let pool = await new mssql.ConnectionPool(config.cloth).connect()
      let request = await pool.request()

      for (let p in params) {
        request.input(p, params[p])
      }
      let result = await request.query(query)
      await pool.close()

      return result.recordset
    } catch (err) {
      console.error('SQL error', err)
    }
  }
}
module.exports = dbMS
