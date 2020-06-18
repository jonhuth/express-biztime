/** Database setup for BizTime. */
const { Client } = require('pg');

let DB_URI;

if (process.env.NODE === 'test') {
  DB_URI = 'postgressql:///biztime_test';
} else {
  DB_URI = 'postgressql:///biztime';
}

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;
