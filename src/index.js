var port = 9999;
var isServer = false;
if (http.Server) {
  // Listen for HTTP connections.
  var app = new Rush();
  app.listen(port);
  app.use(function(req){
    console.log(req);
  });
  app.use(function(req){
    var url = req.params.base;
    if (url == '/')
      url = '/index.html';
    req.serveUrl(url);
    return true;
  });
}