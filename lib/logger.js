'use strict';

var _ = require('underscore');
var irc = require('irc');

var Logger = function (ircClient, clientName, config) {
  this.ircClient = ircClient;
  this.clientName = clientName;
  this.config = config;
};

Logger.prototype.levels = {
  'error': 'light_red',
  'warning': 'yellow',
  'info': 'white',
  'debug': 'light_gray',
};

Logger.prototype.sendMessage = function(level, prefix,  message) {
  var self = this;
  message = '[' + self.clientName + '] ' + irc.colors.wrap(self.levels[level], prefix + ' ') + message;

  _.each(self.config.receivers, function(receiver) {
    self.ircClient.say(receiver, message);
  })
}
Logger.prototype.error = function(message) {
    this.sendMessage('error', 'ERROR:', message);
};

Logger.prototype.warn = function(message) {
    this.sendMessage('warning', 'WARNING:', message);
};

Logger.prototype.info = function(message) {
    this.sendMessage('info', 'INFO:', message);
};

Logger.prototype.log = function(message) {
    this.sendMessage('debug', 'DEBUG:', message);
};

Logger.prototype.new = function(clientName) {
  this.clientName = clientName;
}

exports.Log = Logger;
