var config = {}

config.db = {};
config.web = {};

config.db.name = ':memory:'; // Change to file somewhere in /var/lib/ on production machine

config.web.title = 'microBEZilla';

module.exports = config;
