/**
 *
 */
function Rush(){
  this.server = new http.Server();
  this.server.addEventListener('request', function(req) {
    this.onrequest(req);
    return true;
  }.bind(this));
}
Rush.prototype = {
  routes: [],
  requests: [],
  routerUsed: false,
  listen: function(port){
    this.server.listen(port);
  },
  use: function(path,callback){
    if(!callback){
      callback = path;
      path = '*';
    }
    if(typeof path === 'string')
      path = '^'+path.replace('*','.*');
    this.routes.push({path: path, callback: callback});
  },
  useRouter: function(){
    this.routerUsed = true;
    this.routes.push({path: 'methods'});
  },
  method: function(type,path,callback){
    if(!callback){
      callback = path;
      path = '*';
    }
    path = '^'+path.replace('*','.*');
    this.requests.push({type:type || 'GET',path:path,callback:callback});
  },
  get: function(path, callback){
    this.method('GET',path,callback);
  },
  post: function(path, callback){
    this.method('POST',path,callback);
  },
  put: function(path, callback){
    this.method('PUT',path,callback);
  },
  patch: function(path, callback){
    this.method('PATCH',path,callback);
  },
  delete: function(path, callback){
    this.method('DELETE',path,callback);
  },
  head: function(path, callback){
    this.method('HEAD',path,callback);
  },
  options: function(path, callback){
    this.method('OPTIONS',path,callback);
  },
  onrequest: function(req){
    for(var i = 0; i < this.routes.length; i++){
      if(this.routerUsed && this.routes[i].path === 'methods'){
        this.runMethods(req);
      }else if(this.matchPath(this.routes[i].path,req.params.base)){
        this.routes[i].callback(req);
      }
    }
    if(!this.routerUsed)
      this.runMethods(req);
  },
  matchPath: function(regex,str){
    var tmp = str.match(regex);
    return str === (tmp||[])[0];
  },
  runMethods: function(req){
    for(var i = 0; i < this.requests.length;i++){
      var temp = this.matchPath(this.requests[i].path,req.params.base);
      if(req.headers.method===this.requests[i].type&&temp){
        this.requests[i].callback(req);
      }
    }
  }
};