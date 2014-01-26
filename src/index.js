var port = 9999;
var isServer = false;
if (http.Server) {
  var app = new Rush();
  app.listen(port);
  app.use(function(req,next){
    console.log(req);
    next(req);
  });
  //app.useRouter();
  app.use(function(req,next){
    var url = req.baseURL;
    if (url == '/')
      url = '/index.html';
    req.serveURL(url,function(){next(req)});
  });
  app.get('/:bilbo/:swaggins',function(req,next){
    req.writeText(req.params.bilbo + ' ' + req.params.swaggins);
    next(req);
  });
}