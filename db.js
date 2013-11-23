var sqlite3 = require('sqlite3').verbose();
var config = require('./config');

var db = new sqlite3.Database(config.db.name);

exports.db = db;

exports.init = function() {
  db.get("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type = 'table' AND name = 'version'",
      function (err, row) {
        if (err) {
          console.log('Failed to initialize DB');
          process.exit(1);
        }
        if (row.cnt === 0) {
          db.serialize(function() {
            db.run("CREATE TABLE version (" +
              "version INTEGER NOT NULL" +
              ")");

            db.run("INSERT INTO version(version) VALUES (1)");

            db.run("CREATE TABLE entries (id INTEGER PRIMARY KEY NOT NULL, " +
              "email TEXT NOT NULL DEFAULT '', " +
              "text TEXT NOT NULL DEFAULT '', " +
              "text_rendered TEXT NOT NULL DEFAULT '', " +
              "date INTEGER NOT NULL" +
              ")");

            db.run("CREATE INDEX entries_date_idx ON entries(date)");
          });
        }
      });
};
