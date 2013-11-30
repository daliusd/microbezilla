var marked = require('marked');
var sqlite3 = require('sqlite3').verbose();
var config = require('../config');
var crypto = require('crypto');
var db = require('../db');

marked.setOptions({sanitize: true});


exports.index = function(req, res){
  db.db.all("SELECT entries.id, entries.email, entries.text_rendered, entries.date, datetime(entries.date, 'unixepoch') as fdate FROM entries WHERE date < ? ORDER BY date DESC LIMIT 10", [req.query.date],
      function (err, rows) {
        if (err) {
          console.log('ERROR: entries.index');
          console.log(err);
          res.json({'message': 'Server side failure.'}, 500);
          return;
        }
        for (var i = 0; i < rows.length; i++) {
          var md5sum = crypto.createHash('md5');
          md5sum.update(rows[i].email);
          rows[i].md5 = md5sum.digest('hex');
          rows[i].email = rows[i].email.slice(0, rows[i].email.indexOf('@'));
        }
        res.json({'entries': rows}, 200);
      });
};

exports.get = function(req, res){
  db.db.get("SELECT *, datetime(date, 'unixepoch') as fdate FROM entries WHERE id = ?", [req.params.id],
      function (err, row) {
        if (err) {
          console.log('ERROR: entries.index');
          console.log(err);
          res.json({'message': 'Server side failure.'}, 500);
          return;
        }
        res.json(row, 200);
      });
};

exports.create = function(req, res){
  if (!('email' in req.session) || req.session.email == '') {
    res.json('Really?', 403);
    return;
  }

  var text_rendered = marked(req.body.text);

  var md5sum = crypto.createHash('md5');
  md5sum.update(req.session.email);
  var md5 = md5sum.digest('hex');

  if ('preview' in req.body) {
    res.json({'text_rendered': text_rendered, 'md5': md5});
  }
  else {
    db.db.run("INSERT INTO entries(email, text, text_rendered, date) VALUES (?, ?, ?, strftime('%s','now'))",
        [req.session.email, req.body.text, text_rendered],
        function (err) {
          if (err) {
            console.log('ERROR: entries.create');
            console.log(err);
            res.json({'message': 'Server side failure..'}, 500);
            return;
          }
          else {
            var email = req.session.email.slice(0, req.session.email.indexOf('@'));
            res.json({'id': this.lastID, 'email': email, 'md5': md5, 'text_rendered': text_rendered}, 201);
          }
        });
  }
};

exports.modify = function(req, res){
  if (!('email' in req.session) || req.session.email == '') {
    res.json('Really?', 403);
    return;
  }

  db.db.get("SELECT id, email, datetime(entries.date, 'unixepoch') as fdate FROM entries WHERE id = ?", [req.params.id],
      function (err, row) {
        if (err) {
          console.log('ERROR: entries.modify.check_email');
          console.log(err);
          res.json({'message': 'Server side failure.'}, 500);
          return;
        }
        else if (row == null || row.email != req.session.email) {
          res.json({'message': 'That\'s not your entry.'}, 403);
          return;
        }
        var text_rendered = marked(req.body.text);

        db.db.run("UPDATE entries SET text = ?, text_rendered = ? WHERE id = ?",
          [req.body.text, text_rendered, req.params.id],
          function (err) {
            if (err) {
              console.log('ERROR: entries.modify');
              console.log(err);
              res.json({'message': 'Server side failure..'}, 500)
            }
            else {
              var md5sum = crypto.createHash('md5');
              md5sum.update(req.session.email);
              var md5 = md5sum.digest('hex');

              var email = req.session.email.slice(0, req.session.email.indexOf('@'));

              res.json({'message': 'entry modified', 'id': row.id,
                'email': email, 'md5': md5, 'text_rendered': text_rendered,
                'fdate': row.fdate}, 200);
            }
          });
      });
};

exports.delete = function(req, res){
  if (!('email' in req.session) || req.session.email == '') {
    res.json('Really?', 403);
    return;
  }

  db.db.get("SELECT email FROM entries WHERE id = ?", [req.params.id],
      function (err, row) {
        if (err) {
          console.log('ERROR: entries.delete.check_email');
          console.log(err);
          res.json({'message': 'Server side failure.'}, 500);
          return;
        }
        else if (row == null || row.email != req.session.email) {
          res.json({'message': 'That\'s not your entry.'}, 403);
          return;
        }

        db.db.get("DELETE FROM entries WHERE id = ?", [req.params.id],
            function (err, row) {
              if (err) {
                console.log('ERROR: entries.delete');
                console.log(err);
                res.json({'message': 'Server side failure.'}, 500)
              }
              res.json({'message': 'Entry deleted'}, 200);
            });
      });
};

