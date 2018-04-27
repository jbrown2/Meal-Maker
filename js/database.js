var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'mealmakerdb.cot7rifqev7a.us-east-1.rds.amazonaws.com',
  user: 'mealmaker',
  password: 'mealmakerpassword',
  port: 3306,
  database: 'mmdb'
});

connection.connect(function(err) {
  if (err) {
    console.log('Database connection failed: ', err.stack);
    return;
  }

  console.log('Connected to database');

  var createTable = "CREATE TABLE IF NOT EXISTS user ( id INTEGER PRIMARY KEY AUTO_INCREMENT, ";
  createTable += "username CHAR(255), password CHAR(255) )";

  connection.query(createTable, function(err, result) {
    if (err) throw err;
    console.log('Table created');
  });
});

exports.connection = connection;
