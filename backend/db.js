const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
