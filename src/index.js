var port = 8000,app;

function start(callback){
  if (!!app)
    app.server.destroy();
  if (http.Server) {
    app = new Rush();
    app.listen(port);
    callback(app);
  }
}
function routing(rush,comment){
  //Data can pass straight through (to log)
  rush.use(function(req,next){
    console.log(req);
    next(req);
  });
  if(comment)
    rush.useRouter();
  /*Or they can not continue unless they fail
   *This is useful because we want files to have higher 
   *prefence but still let functions afterwards work.
   */
  rush.use(function(req,next){
    var url = req.baseURL;
    if (url == '/')
      url = '/index.html';
    req.serveURL(url,function(){next(req)});
  });
  //catches any url that has 2 parts excluding params
  rush.get('/:first/:second',function(req){
    req.writeText(req.params.second + ' vs. ' + req.params.first);
  });
  //catches any url that starts with /hello/
  rush.get('/hello/*',function(req){
    req.writeText('hello world');
  });
  //matchs any single peice
  rush.get('/:hello',function(req){
    req.writeText(req.params.hello);
  });
}
start(function(rush){routing(rush)});