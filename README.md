Gold Rush
==========
What?
----
Gold Rush is a web framework for a backend server running on chrome apps. This means that anywhere Chrome(desktop) can run, Gold Rush can run too. Getting node installed simple to test a few backend snippets doesn't make sense. Instead, making a small chrome app server is much easier and faster. Though, before this framework, there were no easy ways to make a chrome app server; the only way to make a server was through raw sockets. With this framework, a new adaptable server can be up in minutes. 

Influences
----------
Sinatra, Express and Martini are the models this framework tries to emulate. The goal of this project is to make this framework easy enough to switch out for any of these(though express will obviously be the easiest).

How?
----
In short, [Socket Api](http://developer.chrome.com/apps/socket.html).

How to Install / Use:
---------------------
For just playing around, installing a [basic app](https://chrome.google.com/webstore/detail/bbigdiocphkimgppcokfafamfggecpmj/) and debugging can be helpful to learn the framework.   
For a longer lasting test environment, make a simple chrome app and load http.js and rush.js before the main app runs.
