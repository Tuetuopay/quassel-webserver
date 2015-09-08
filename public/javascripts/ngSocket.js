/*
 * ngSocket.js
 * https://github.com/chrisenytc/ng-socket
 *
 * Copyright (c) 2013 Christopher EnyTC, David Prothero
 * Licensed under the MIT license.
 */

// Module Copyright (c) 2013 Michael Benford

// Module for provide Socket.io support

(function () {
  'use strict';

  angular.module('ngQuassel', []).provider('$quassel', socketProvider);

  function socketProvider() {
    var Quassel = require('quassel');
    
    this.$get = [socketFactory];

    function socketFactory() {
      this.quassel = null;
      this.server = '';
      this.port = '';
      this.login = '';
      this.password = '';
      var self = this;
      
      var service = {
        addListener: addListener,
        on: addListener,
        once: addListenerOnce,
        removeListener: removeListener,
        removeAllListeners: removeAllListeners,
        emit: emit,
        setServer: setServer,
        'get': getQuassel,
        markBufferAsRead: markBufferAsRead,
        moreBacklogs: moreBacklogs,
        sendMessage: sendMessage,
        requestDisconnectNetwork: requestDisconnectNetwork,
        requestConnectNetwork: requestConnectNetwork,
        requestRemoveBuffer: requestRemoveBuffer,
        requestMergeBuffersPermanently: requestMergeBuffersPermanently,
        requestUpdate: requestUpdate
      };

      return service;
      
      function setServer(_server, _port, _login, _password) {
        self.server = _server;
        self.port = _port;
        self.login = _login;
        self.password = _password;
        self.quassel.server = self.server;
        self.quassel.port = self.port;
      }
      
      function getQuassel() {
        return self.quassel;
      }
      
      ////////////////////////////////

      function initializeSocket() {
        //Check if socket is undefined
        if (self.quassel === null) {
          self.quassel = new Quassel(self.server, self.port, {
              nobacklogs: 0,
              backloglimit: 50,
              unsecurecore: true // tls-browserify module doesn't respect tls API of nodejs
          }, function(next) {
              next(self.login, self.password);
          });
        }
      }

      function angularCallback(callback) {
        return function () {
          if (callback) {
            var args = arguments;
            callback.apply(self.quassel, args);
          }
        };
      }

      function addListener(name, scope, callback) {
        initializeSocket();

        if (arguments.length === 2) {
          scope = null;
          callback = arguments[1];
        }

        self.quassel.on(name, angularCallback(callback));

        if (scope !== null) {
          scope.$on('$destroy', function () {
            removeListener(name, callback);
          });
        }
      }

      function addListenerOnce(name, callback) {
        initializeSocket();
        self.quassel.once(name, angularCallback(callback));
      }

      function removeListener(name, callback) {
        initializeSocket();
        self.quassel.removeListener(name, angularCallback(callback));
      }

      function removeAllListeners(name) {
        initializeSocket();
        self.quassel.removeAllListeners(name);
      }

      function emit(name, data, callback) {
        initializeSocket();
        if (typeof callback === 'function') {
            self.quassel.emit(name, data, angularCallback(callback));
        } else {
            self.quassel.emit.apply(self.quassel, Array.prototype.slice.call(arguments));
        }
      }
      
      function markBufferAsRead(bufferId, lastMessageId) {
        self.quassel.requestSetLastMsgRead(bufferId, lastMessageId);
        self.quassel.requestMarkBufferAsRead(bufferId);
        self.quassel.requestSetMarkerLine(bufferId, lastMessageId);
      }
      
      function moreBacklogs(bufferId, firstMessageId) {
        self.quassel.requestBacklog(bufferId, -1, firstMessageId, 50);
      }
      
      function sendMessage(bufferId, message) {
        self.quassel.sendMessage(bufferId, message);
      }
      
      function requestDisconnectNetwork(networkId) {
        self.quassel.requestDisconnectNetwork(networkId);
      }
      
      function requestConnectNetwork(networkId) {
        self.quassel.requestConnectNetwork(networkId);
      }
      
      function requestRemoveBuffer(bufferId) {
        self.quassel.requestRemoveBuffer(bufferId);
      }
      
      function requestMergeBuffersPermanently(bufferId1, bufferId2) {
        self.quassel.requestMergeBuffersPermanently(bufferId1, bufferId2);
      }
      
      function requestUpdate(ignoreList) {
        self.quassel.requestUpdate(ignoreList);
      }
    }
  }

})();
