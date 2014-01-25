/**
 *
 */
function Rush(){

}
Rush.prototype = {
  routes: [],
  requests: [],
  routerUsed: false,
  use: function(path,callback){
    if(!callback){
      callback = path;
      path = '*';
    }
    path = '^'+path.replace('*','.*');
    routes.push({path: path, callback: callback});
  },
  method: function(type,path,callback){
    if(!callback){
      callback = path;
      path = '*';
    }
    path = '^'+path.replace('*','.*');
    requests.push({type:type || 'GET',path:path,callback:callback});
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
};