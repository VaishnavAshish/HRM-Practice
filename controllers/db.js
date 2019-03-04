const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL||'postgres://bzhswtshdcptxr:c1c1204a1660bb96715dcec9cf5d79f21fd72d4b1b40c63fdde9ceaa918f89ad@ec2-23-23-216-40.compute-1.amazonaws.com:5432/d6gia5vob5qrnh');

client.connect((err) => {
  if (err) {
    console.error(err);
    // console.log('%s Postgresql connection error. Please make sure Postgresql is running.', chalk.red('✗'));
    process.exit();
  } else {
    // console.log('connected')
  }
});
module.exports = client;