Gold Rush
==========
What is it?
----
Gold Rush is a web framework for a backend server running on chrome apps. This means that anywhere Chrome(desktop) can run, Gold Rush can run too. Getting node installed simple to test a few backend snippets doesn't make sense. Instead, making a small chrome app server is much easier and faster. Though, before this framework, there were no easy ways to make a chrome app server; the only way to make a server was through raw sockets. With this framework, a new adaptable server can be up in minutes. 

Influences
----------
Sinatra, Express and Martini are the models this framework tries to emulate. The goal of this project is to make this framework easy enough to switch out for any of these(though express will obviously be the easiest).

How does it work?
----
In short, [Socket Api](http://developer.chrome.com/apps/socket.html).

How to Install / Use:
---------------------
For just playing around, installing a [basic app](https://chrome.google.com/webstore/detail/bbigdiocphkimgppcokfafamfggecpmj/) and debugging can be helpful to learn the framework.  
In order to debug/play aroung with the app, you need to start it(it will be blank), go to ```chrome://inspect/#apps```, and inspect Gold Rush. There will be two, you need to click the one that does not have background in its url. Then you should have a debug window that has access to the api.

For a longer term solution, clone this repo, go into ```chrome://extensions```, enable developer mode, and click load unpacked extension. Once it is installed that way, you can edit ```src/index.js``` or open a debug window to do live coding.
