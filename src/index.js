var port = 9999;
var isServer = false;
if (http.Server) {
  var app = new Rush();
  app.listen(port);
  app.use(function(req){
    console.log(req);
  });
  app.useRouter();
  app.use(function(req){
    var url = req.params.base;
    if (url == '/')
      url = '/index.html';
    req.serveUrl(url);
  });
  app.use(function(req){
    var url = req.params.base;
    if (url == '/')
      url = '/index.html';
    req.serveUrl(url);
  });
  /*app.get('/yolo/swaggins',function(req){
    req.writeText('hello there');
  });*/
  app.get('/:bilbo/:swaggins',function(req){
    req.writeText('hello there');
  });
}