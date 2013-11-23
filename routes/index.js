var config = require('../config');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: config.web.title });
};
