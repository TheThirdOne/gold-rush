/**
 * Copyright (c) 2013 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var http = function() {
  
  var socket = (chrome.experimental && chrome.experimental.socket) ||
      chrome.socket;
  
  // If this does not have chrome.socket, then return an empty http namespace.
  if (!socket)
    return {};
  
  // Http response code strings.
  var responseMap = {
    200: 'OK',
    301: 'Moved Permanently',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    500: 'Internal Server Error'};
  
  /**
   * Convert from an ArrayBuffer to a string.
   * @param {ArrayBuffer} buffer The array buffer to convert.
   * @return {string} The textual representation of the array.
   */
  var arrayBufferToString = function(buffer) {
    var array = new Uint8Array(buffer);
    var str = '';
    for (var i = 0; i < array.length; ++i) {
      str += String.fromCharCode(array[i]);
    }
    return str;
  };
  
  /**
   * Convert a string to an ArrayBuffer.
   * @param {string} string The string to convert.
   * @return {ArrayBuffer} An array buffer whose bytes correspond to the string.
   */
  var stringToArrayBuffer = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var bufferView = new Uint8Array(buffer);
    for (var i = 0; i < string.length; i++) {
      bufferView[i] = string.charCodeAt(i);
    }
    return buffer;
  };
  
  /**
   * An event source can dispatch events. These are dispatched to all of the
   * functions listening for that event type with arguments.
   * @constructor
   */
  function EventSource() {
    this.listeners_ = {};
  }
  
  EventSource.prototype = {
    /**
     * Add |callback| as a listener for |type| events.
     * @param {string} type The type of the event.
     * @param {function(Object|undefined): boolean} callback The function to call
     *     when this event type is dispatched. Arguments depend on the event
     *     source and type. The function returns whether the event was "handled"
     *     which will prevent delivery to the rest of the listeners.
     */
    addEventListener: function(type, callback) {
      if (!this.listeners_[type])
        this.listeners_[type] = [];
      this.listeners_[type].push(callback);
    },
  
    /**
     * Remove |callback| as a listener for |type| events.
     * @param {string} type The type of the event.
     * @param {function(Object|undefined): boolean} callback The callback
     *     function to remove from the event listeners for events having type
     *     |type|.
     */
    removeEventListener: function(type, callback) {
      if (!this.listeners_[type])
        return;
      for (var i = this.listeners_[type].length - 1; i >= 0; i--) {
        if (this.listeners_[type][i] == callback) {
          this.listeners_[type].splice(i, 1);
        }
      }
    },
  
    /**
     * Dispatch an event to all listeners for events of type |type|.
     * @param {type} type The type of the event being dispatched.
     * @param {...Object} var_args The arguments to pass when calling the
     *     callback function.
     * @return {boolean} Returns true if the event was handled.
     */
    dispatchEvent: function(type, var_args) {
      if (!this.listeners_[type])
        return false;
      for (var i = 0; i < this.listeners_[type].length; i++) {
        if (this.listeners_[type][i].apply(
                /* this */ null,
                /* var_args */ Array.prototype.slice.call(arguments, 1))) {
          return true;
        }
      }
    }
  };
  
  /**
   * HttpServer provides a lightweight Http web server. Currently it only
   * supports GET requests and upgrading to other protocols (i.e. WebSockets).
   * @constructor
   */
  function HttpServer() {
    EventSource.apply(this);
    this.readyState_ = 0;
  }
  
  HttpServer.prototype = {
    __proto__: EventSource.prototype,
  
    /**
     * Listen for connections on |port| using the interface |host|.
     * @param {number} port The port to listen for incoming connections on.
     * @param {string=} opt_host The host interface to listen for connections on.
     *     This will default to 0.0.0.0 if not specified which will listen on
     *     all interfaces.
     */
    listen: function(port, opt_host) {
      var t = this;
      socket.create('tcp', {}, function(socketInfo) {
        t.socketInfo_ = socketInfo;
        socket.listen(t.socketInfo_.socketId, opt_host || '0.0.0.0', port, 50,
                      function(result) {
          t.readyState_ = 1;
          t.acceptConnection_(t.socketInfo_.socketId);
        });
      });
    },
  
    acceptConnection_: function(socketId) {
      var t = this;
      socket.accept(this.socketInfo_.socketId, function(acceptInfo) {
        t.onConnection_(acceptInfo);
        t.acceptConnection_(socketId);
      });
    },
  
    onConnection_: function(acceptInfo) {
      this.readRequestFromSocket_(acceptInfo.socketId);
    },
  
    readRequestFromSocket_: function(socketId) {
      var t = this;
      var requestData = '';
      var endIndex = 0;
      var onDataRead = function(readInfo) {
        // Check if connection closed.
        if (readInfo.resultCode <= 0) {
          socket.disconnect(socketId);
          socket.destroy(socketId);
          return;
        }
        requestData += arrayBufferToString(readInfo.data).replace(/\r\n/g, '\n');
        // Check for end of request.
        endIndex = requestData.indexOf('\n\n', endIndex);
        if (endIndex == -1) {
          endIndex = requestData.length - 1;
          socket.read(socketId, onDataRead);
          return;
        }
  
        var headers = requestData.substring(0, endIndex).split('\n');
        var headerMap = {};
        // headers[0] should be the Request-Line
        var requestLine = headers[0].split(' ');
        headerMap['method'] = requestLine[0];
        headerMap['url'] = requestLine[1];
        headerMap['Http-Version'] = requestLine[2];
        for (var i = 1; i < headers.length; i++) {
          requestLine = headers[i].split(':', 2);
          if (requestLine.length == 2)
            headerMap[requestLine[0]] = requestLine[1].trim();
        }
        var request = new HttpRequest(headerMap, socketId,requestData);
        t.onRequest_(request);
      }
      socket.read(socketId, onDataRead);
    },
  
    onRequest_: function(request) {
      var type = request.headers['Upgrade'] ? 'upgrade' : 'request';
      var keepAlive = request.headers['Connection'] == 'keep-alive';
      if (!this.dispatchEvent(type, request))
        request.close();
      else if (keepAlive)
        this.readRequestFromSocket_(request.socketId_);
    },
  };
  
  // MIME types for common extensions.
  var extensionTypes = {
    'css': 'text/css',
    'html': 'text/html',
    'htm': 'text/html',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'js': 'text/javascript',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'txt': 'text/plain'};
  
  /**
   * Constructs an HttpRequest object which tracks all of the request headers and
   * socket for an active Http request.
   * @param {Object} headers The HTTP request headers.
   * @param {number} socketId The socket Id to use for the response.
   * @constructor
   */
  function HttpRequest(headers, socketId, raw) {
    this.version = 'HTTP/1.1';
    this.headers = headers;
    this.responseHeaders_ = {};
    this.headersSent = false;
    this.socketId_ = socketId;
    this.writes_ = 0;
    this.bytesRemaining = 0;
    this.finished_ = false;
    this.readyState = 1;
    this.raw = raw;
    this.params = parseUrl(this.headers.url)
  }
  
  function parseUrl(str){
    var params = {},temp,t,tmp;
    temp = str.split('?');
    if(temp[1]){
      t = temp[1].split('&');
      for(var i = 0; i < t.length;i++){
        tmp = t[i].split('=');
        if(tmp[1])
          params[decodeURI(tmp[0])]=decodeURI(tmp[1]);
      }
    }
    return {base:temp[0],params:params}
  }
  HttpRequest.prototype = {
    __proto__: EventSource.prototype,
  
    /**
     * Closes the Http request.
     */
    close: function() {
      // The socket for keep alive connections will be re-used by the server.
      // Just stop referencing or using the socket in this HttpRequest.
      if (this.headers['Connection'] != 'keep-alive') {
        socket.disconnect(this.socketId_);
        socket.destroy(this.socketId_);
      }
      this.socketId_ = 0;
      this.readyState = 3;
    },
  
    /**
     * Write the provided headers as a response to the request.
     * @param {int} responseCode The HTTP status code to respond with.
     * @param {Object} responseHeaders The response headers describing the
     *     response.
     */
    writeHead: function(responseCode, responseHeaders) {
      var headerString = this.version + ' ' + responseCode + ' ' +
          (responseMap[responseCode] || 'Unknown');
      this.responseHeaders_ = responseHeaders;
      if (this.headers['Connection'] == 'keep-alive')
        responseHeaders['Connection'] = 'keep-alive';
      if (!responseHeaders['Content-Length'] && responseHeaders['Connection'] == 'keep-alive')
        responseHeaders['Transfer-Encoding'] = 'chunked';
      for (var i in responseHeaders) {
        headerString += '\r\n' + i + ': ' + responseHeaders[i];
      }
      headerString += '\r\n\r\n';
      this.write_(stringToArrayBuffer(headerString));
    },
  
    /**
     * Writes data to the response stream.
     * @param {string|ArrayBuffer} data The data to write to the stream.
     */
    write: function(data) {
      if (this.responseHeaders_['Transfer-Encoding'] == 'chunked') {
        var newline = '\r\n';
        var byteLength = (data instanceof ArrayBuffer) ? data.byteLength : data.length;
        var chunkLength = byteLength.toString(16).toUpperCase() + newline;
        var buffer = new ArrayBuffer(chunkLength.length + byteLength + newline.length);
        var bufferView = new Uint8Array(buffer);
        for (var i = 0; i < chunkLength.length; i++)
          bufferView[i] = chunkLength.charCodeAt(i);
        if (data instanceof ArrayBuffer) {
          bufferView.set(new Uint8Array(data), chunkLength.length);
        } else {
          for (var i = 0; i < data.length; i++)
            bufferView[chunkLength.length + i] = data.charCodeAt(i);
        }
        for (var i = 0; i < newline.length; i++)
          bufferView[chunkLength.length + byteLength + i] = newline.charCodeAt(i);
        data = buffer;
      } else if (!(data instanceof ArrayBuffer)) {
        data = stringToArrayBuffer(data);
      }
      this.write_(data);
    },
  
    /**
     * Finishes the HTTP response writing |data| before closing.
     * @param {string|ArrayBuffer=} opt_data Optional data to write to the stream
     *     before closing it.
     */
    end: function(opt_data) {
      if (opt_data)
        this.write(opt_data);
      if (this.responseHeaders_['Transfer-Encoding'] == 'chunked')
        this.write('');
      this.finished_ = true;
      this.checkFinished_();
    },
    
    /**
     * 
     * 
     */
     writeText: function(str, type){
        this.writeHead(this.status, {
          'Content-Type': type || 'text/plain',
          'Content-Length': str.length});
        this.write(str);
     },
    /**
     * Automatically serve the given |url| request.
     * @param {string} url The URL to fetch the file to be served from. This is
     *     retrieved via an XmlHttpRequest and served as the response to the
     *     request.
     */
    serveUrl: function(url,callback) {
      var t = this;
      var xhr = new XMLHttpRequest();
      xhr.onloadend = function() {
        if(xhr.status!==200)
          callback();
        var type = 'text/plain';
        if (this.getResponseHeader('Content-Type')) {
          type = this.getResponseHeader('Content-Type');
        } else if (url.indexOf('.') != -1) {
          var extension = url.substr(url.indexOf('.') + 1);
          type = extensionTypes[extension] || type;
        }
        console.log('Served ' + url);
        var contentLength = this.getResponseHeader('Content-Length');
        if (xhr.status == 200)
          contentLength = (this.response && this.response.byteLength) || 0;
        t.writeHead(this.status, {
          'Content-Type': type,
          'Content-Length': contentLength});
        t.end(this.response);
      };
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.send();
    },
  
    write_: function(array) {
      var t = this;
      this.bytesRemaining += array.byteLength;
      socket.write(this.socketId_, array, function(writeInfo) {
        if (writeInfo.bytesWritten < 0) {
          console.error('Error writing to socket, code '+writeInfo.bytesWritten);
          return;
        }
        t.bytesRemaining -= writeInfo.bytesWritten;
        t.checkFinished_();
      });
    },
  
    checkFinished_: function() {
      if (!this.finished_ || this.bytesRemaining > 0)
        return;
      this.close();
    }
  };
  return {
    'Server': HttpServer
  };
}();