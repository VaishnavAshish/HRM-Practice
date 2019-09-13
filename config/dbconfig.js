const { Pool,types } = require('pg');
const connectionString = process.env.DATABASE_URL;

types.setTypeParser(1114, function(stringValue) {
  return stringValue;
});

const { Client } = require('pg')
const client = new Client("postgres://postgres:athena@localhost:5432/database")
client.connect();

console.log(client)

const pool = new Pool({
  connectionString: connectionString,
  max: 100, // max number of connection can be open to database
  idleTimeoutMillis: 60000, // how long a client is allowed to remain id
});

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // process.exit(-1);
});


module.exports = pool;
