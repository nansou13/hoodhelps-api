/* eslint-disable eqeqeq */
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

const pool = new Pool({
  connectionString,
  ssl:
    process.env.DEV == 1 || process.env.NODE_ENV === 'test' ? false : { rejectUnauthorized: false },
})

module.exports = pool
