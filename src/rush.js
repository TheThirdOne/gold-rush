/**
 * Main server object
 * @contructor
 */
function Rush(){
  this.routes = [];
  this.requests = [];
  this.routerUsed = false;
  this.server = new http.Server();
  this.server.addEventListener('request', function(req) {
    this.onrequest(req);
    return true;
  }.bind(this));
}
Rush.prototype = {
  /**
   * Starts the server listening on a port
   * @param {Number} port 
   */
  listen: function(port){
    this.server.listen(port);
  },
  /**
   * Apply middleware independent of request type
   * @param {Regex | String} path path affected bythe middleware
   * @param {Function} callback called upon new request
   */
  use: function(path,callback){
    console.log('use')
    if(!callback){
      callback = path;
      path = '*';
    }
    if(typeof path === 'string')
      path = '^'+path.replace('*','.*');
    this.routes.push({path: path, callback: callback});
  },
  /**
   * Sets where in the stack the main router is.
   */
  useRouter: function(){
    console.log('rout')
    this.routerUsed = true;
    this.routes.push({path: 'methods'});
  },
  /**
   * Abstract function for pushing any callback based on the main router
   * @param {String} type GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
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
  /**
   * For GET requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  get: function(path, callback){
    this.method('GET',path,callback);
  },
   /**
   * For POST requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  post: function(path, callback){
    this.method('POST',path,callback);
  },
  /**
   * For PUT requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  put: function(path, callback){
    this.method('PUT',path,callback);
  },
  /**
   * For PATCH requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  patch: function(path, callback){
    this.method('PATCH',path,callback);
  },
  /**
   * For DELETE requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  delete: function(path, callback){
    this.method('DELETE',path,callback);
  },
  /**
   * For HEAD requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  head: function(path, callback){
    this.method('HEAD',path,callback);
  },
  /**
   * For OPTIONS requests
   * @param {String} path path affected; can use :name's to absctract
   * @param {Function} callback called upon new request
   */
  options: function(path, callback){
    this.method('OPTIONS',path,callback);
  },
  
  /**
   * Initial request handler
   * @param [HTTPRequest] req 
   */
  onrequest: function(req){
    this.route(req,0);
  },
  /**
   * make callbacks for functions to pass along data
   * @param [Number] index
   */
  nextgen: function(ind){
    var t = this;
    return function(req){
        t.route(req,ind+1);
    }
  },
  /**
   * Main routing function
   * @param {HTTPRequest} req
   * @param {Number} index 
   */
  route: function(req, ind){
    if(ind >= this.routes.length)
      return this.onrequestend(req)
    if(this.routerUsed && this.routes[ind].path === 'methods'){
      this.runMethods(req,this.nextgen(ind));
    }else if(this.matchPath(this.routes[ind].path,req.baseURL)){
      this.routes[ind].callback(req,this.nextgen(ind));
    }else{
      this.route(req,ind++);
    }
  },
  /**
   * End ofthe request functions
   * @param {HTTPRequest} req
   */
  onrequestend:function(req){
    if(!this.routerUsed)
      this.runMethods(req);
  },
  /**
   * Test if regex matches a path
   * @param {Regex} regex
   * @param {String} path
   */
  matchPath: function(regex,str){
    return str === (str.match(regex)||[])[0];
  },
  /**
   * Runs the method specific requests against the request
   * @param {HTTPRequest} req
   */
  runMethods: function(req,next){
    for(var i = 0; i < this.requests.length;i++){
      var temp = this.matchPath(this.requests[i].path,req.baseURL);
      if(req.headers.method===this.requests[i].type&&temp){
        if(this.requests[i].prelim){
          var additional = this.requests[i].prelim(req.baseURL);
          for(var k = 0; k < additional.length;k++){
            req.params[additional[k][0]]=additional[k][1];
          }
        }
        if(this.requests[i].callback(req)){
          return;
        }
      }
    }
    if(next)next(req);
  }
};