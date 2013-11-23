microbezilla
============

This is experimental micro-blogging engine. My idea
is to create service that can be used for your
project, company, community or other group of people.
Simply grab the code, edit config file and run service.

You can try out running service at http://microbezilla.sandbox.lt/

Technologies
------------

I have made some fun choices with Technologies and here are
reasons why.

I have used Persona because:

* It is simple and I don't need to create my own
login system.

* I get e-mail that I can use with gravatar.

* We can use e-mail to allow or disallow users (in the future).

* You can run your own Persona server.

SQLite:

* It is quite powerful.

* I don't expect that this service will be used by many users. Let't test if truth is written here: http://sqlite.org/whentouse.html

* Nothing to configure for users.

If there will be need it is always possible to change SQLite to something more appropriate but
I expect that SQLite will be enough for long time.

