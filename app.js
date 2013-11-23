
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var entries = require('./routes/entries');
var http = require('http');
var path = require('path');
var config = require('./config');
var db = require('./db');

db.init();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.get('/entries', entries.index);
app.get('/entries/:id', entries.get);
app.post('/entries', entries.create);
app.put('/entries/:id', entries.modify);
app.delete('/entries/:id', entries.delete);

require('express-persona')(app, {
  audience: config.web.persona_audience
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
