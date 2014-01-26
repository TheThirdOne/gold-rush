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
    var t,tm = [],tmp=[],k = 0,slash = 0;
    if(t = path.match(/:([^\/$]+)/g)){
      for(var i = 0; i < t.length;i++){
        tm[i] = path.indexOf(t[i]);
      }
      for(i = 0; i < path.length;i++){
        if(path[i]==='/')
          slash++;
        if(tm[k] <= i){
          tmp[k] = slash;
          k++;
        }
      }
      path = path.replace(/:[^\/]+/g,'[^\/]+')
      var prelim = function(t,tmp){
        return function(str){
          var temp = str.split('/'),out=[];
          for(var i = 0;i < t.length;i++){
            out[i]=[t[i].slice(1,t[i].length),temp[tmp[i]]];
          }
          return out;
        }
      }(t,tmp);
    }
    path = '^'+path.replace('*','.*');
    this.requests.push({type:type || 'GET',prelim: prelim,path:path,callback:callback});
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
    this.route(req,0);
  },
  nextgen: function(ind){
    var t = this;
    return function(req){
        t.route(req,ind+1);
    }
  },
  route: function(req, ind){
    if(ind >= this.routes.length)
      return this.onrequestend(req)
    if(this.routerUsed && this.routes[ind].path === 'methods'){
      this.runMethods(req,this.nextgen(ind));
    }else if(this.matchPath(this.routes[ind].path,req.baseURL)){
      this.routes[ind].callback(req,this.nextgen(ind));
    }
  },
  onrequestend:function(req){
    if(!this.routerUsed)
      this.runMethods(req);
  },
  matchPath: function(regex,str){
    var tmp = str.match(regex);
    return str === (tmp||[])[0];
  },
  runMethods: function(req){
    for(var i = 0; i < this.requests.length;i++){
      var temp = this.matchPath(this.requests[i].path,req.baseURL);
      if(req.headers.method===this.requests[i].type&&temp){
        if(this.requests[i].prelim){
          var additional = this.requests[i].prelim(req.baseURL);
          for(var k = 0; k < additional.length;k++){
            req.params[additional[k][0]]=additional[k][1];
          }
          console.log(req);
        }
        this.requests[i].callback(req);
      }
    }
  }
};