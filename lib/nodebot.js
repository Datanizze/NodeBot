var irc = require('irc');
var async = require('async');
var _ = require('underscore');

var NodeBot = function(server, nick, options) {
  'use strict';
  var self = this;
  self.server = server;
  self.nick = nick;
  self.options = options;

  self.middlewares = [];
  self.endpoints = [];

  //Setup client.
  self.client = new irc.Client(server, nick, options);
  // increase max listeners for EventEmitter
  self.client.setMaxListeners(20);

  self.init();
};


NodeBot.prototype.init = function() {
  var self = this;

  self.client.once('registered', function() {
    self.initListeners();
  });
};

NodeBot.prototype.initListeners = function() {
  var self = this;
  var listeners = [
    'Error', 'Invite', 'Join',
    'Kick', 'Kill', 'Message',
    'MMode', 'Nick', 'Notice',
    'Part', 'Pm', 'PMode',
    'Quit', 'Topic'
  ];

  _.each(listeners, function(listener) {
    self['init' + listener + 'Listener']();
  });
};

NodeBot.prototype.use = function(eventTypes, middleware) {
  var self = this;
  if ('function' == typeof eventTypes) {
    middleware = eventTypes;
    eventTypes = true;
  }

  // put middleware on the stack.
  self.middlewares.push({
    eventTypes: eventTypes,
    handle: middleware
  });
};

NodeBot.prototype.on = function(eventType, matcher, callback) {
  var self = this;

  if ('function' == typeof matcher) {
    callback = matcher;
    matcher = true;
  }

  self.endpoints.push({
    eventType: eventType,
    match: matcher,
    handle: callback
  });
};

// TODO: shouldn't be a public function eh?
NodeBot.prototype.handle = function(eventDetails) {
  var self = this;
  var index = 0;
  var middlewares = self.middlewares;
  var req = eventDetails;
  var res = 'NO USES YET, NOT IMPLEMENTED';

  var event = eventDetails.eventType;

  function next() {
    var layer = middlewares[index++];

    if (!layer) { // no more layers, continue with endpoints
      self.handleEndpoints(req, res);
      return;
    }

    layer.handle(req, res, next);
  }
  next();
};

NodeBot.prototype.handleEndpoints = function(req, res) {
  var self = this;
  var endpoints = self.endpoints;
  var handled = false;
  var c = 0;

  while (!handled && c < endpoints.length) {
    var endpoint = endpoints[c];
    if (req.eventType === endpoint.eventType) {
      handled = endpoint.match === true || self.checkMatcher(endpoint.match, req);
      if (handled) {
        endpoint.handle(req, res);
      }
    }

    c++;
  }
};

NodeBot.prototype.checkMatcher = function(matcher, req) {
  var match = false;

  var targets = [
  'from', 'to', 'text',
  'channel', 'nick', 'by',
  'reason', 'oldnick', 'newnick'
  ];

  var c = 0;
  while (!match && c < targets.length) {
    if (req[targets[c]]) {
      match = matcher.test(req[targets[c]]);
      console.log(matcher, req[targets[c]], matcher.test(req[targets[c]]));
    }
    c++;
  }
  return match;
};

NodeBot.prototype.say = function(to, text) {
  var self = this;

  self.client.say(to, text);
};

NodeBot.prototype.do = function(to, text) {
  var self = this;

  self.client.action(to, text);
};

NodeBot.prototype.notice = function(to, text) {
  var self = this;

  self.client.notice(to, text);
};

NodeBot.prototype.whois = function(who, callback) {
  var self = this;

  self.client.whois(who, callback);
};

NodeBot.prototype.join = function(channel, callback) {
  var self = this;

  self.client.join(channel, callback);
};

NodeBot.prototype.part = function(channel, message, callback) {
  var self = this;

  self.client.part(channel, message, callback);
};

// TODO: add connect and disconnect here when needed...


NodeBot.prototype.initErrorListener = function() {
  var self = this;
  var eventType = 'error';
  self.client.addListener(eventType, function(raw) {
    console.log("\nSOMETHING WENT BONKERS:", raw, "\n");
    self.handle({
      'eventType': eventType,
      'raw': raw
    });
  });
};

NodeBot.prototype.initInviteListener = function() {
  var self = this;
  var eventType = 'invite';
  self.client.addListener(eventType, function(channel, from, raw) {
    console.log('BEEN INVITED TO %s BY %s', channel, from);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channel': channel,
      'from': from
    });
    self.client.join(channel);
    self.client.say(channel, 'Thank you ' + from + ' for inviting me!');
  });
};

NodeBot.prototype.initJoinListener = function() {
  var self = this;
  var eventType = 'join';
  self.client.addListener(eventType, function(channel, nick, raw) {
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channel': channel,
      'nick': nick
    });
  });
};

NodeBot.prototype.initKickListener = function() {
  var self = this;
  var eventType = 'kick';
  self.client.addListener(eventType, function(channel, nick, by, reason, raw) {
    console.log('%s KICKED FROM %s BY %s BEACAUSE "%s"', nick, channel, by, reason);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channel': channel,
      'nick': nick,
      'by': by,
      'reason': reason
    });
  });
};

NodeBot.prototype.initKillListener = function() {
  var self = this;
  var eventType = 'kill';
  self.client.addListener(eventType, function(nick, reason, channels, raw) {
    console.log('%s GOT KILLED BECAUSE "%s"', nick, reason);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channels': channels,
      'nick': nick,
      'reason': reason
    });
  });
};

NodeBot.prototype.initMessageListener = function() {
  var self = this;
  var eventType = 'message';
  self.client.addListener(eventType, function(nick, to, text, raw) {
    console.log('GOT MESSAGE "%s" FROM %s IN %s', text, nick, to);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'nick': nick,
      'to': to,
      'text': text
    });
  });
};

NodeBot.prototype.initMModeListener = function() {
  var self = this;
  var eventType = '-mode';
  self.client.addListener(eventType, function(channel, by, mode, argument, raw) {
    console.log('MODE:-%s BY %s IN %s. ARGS: %s', mode, by, channel, argument);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channel': channel,
      'by': by,
      'mode': mode,
      'argument': argument
    });
  });
};

NodeBot.prototype.initNickListener = function() {
  var self = this;
  var eventType = 'nick';
  self.client.addListener(eventType, function(oldnick, newnick, channels, raw) {
    console.log('%s CHANGED NICK TO %s', oldnick, newnick);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'oldnick': oldnick,
      'newnick': newnick,
      'channels': channels
    });
  });
};

NodeBot.prototype.initNoticeListener = function() {
  var self = this;
  var eventType = 'notice';
  self.client.addListener(eventType, function(nick, to, text, raw) {
    console.log('GOT NOTICE "%s" IN %s FROM %s', text, to, nick);
    self.handle({
      'eventType': eventType,
      'nick': nick,
      'to': to,
      'text': text
    });
  });
};

NodeBot.prototype.initPartListener = function() {
  var self = this;
  var eventType = 'part';
  self.client.addListener(eventType, function(channel, nick, reason, raw) {
    console.log('%s LEFT %s BECAUSE "%s"', nick, channel, reason);
    self.handle({
      'eventType': eventType,
      'channel': channel,
      'nick': nick,
      'reason': reason
    });
  });
};

NodeBot.prototype.initPmListener = function() {
  var self = this;
  var eventType = 'pm';
  self.client.addListener(eventType, function(nick, text, raw) {
    console.log('PRIVATE MESSAGE FROM %s: "%s"', nick, text);
    self.handle({
      'eventType': eventType,
      'from': nick,
      'text': text
    });
  });
};

NodeBot.prototype.initPModeListener = function() {
  var self = this;
  var eventType = '+mode';
  self.client.addListener(eventType, function(channel, by, mode, argument, raw) {
    console.log('MODE:+%s BY %s IN %s. ARGS: %s', mode, by, channel, argument);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channel': channel,
      'by': by,
      'mode': mode,
      'argument': argument
    });
  });
};

NodeBot.prototype.initQuitListener = function() {
  var self = this;
  var eventType = 'quit';
  self.client.addListener(eventType, function(nick, reason, channels, raw) {
    console.log(eventType.toUpperCase(), arguments);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channels': channels,
      'nick': nick,
      'reason': reason
    });
  });
};

NodeBot.prototype.initTopicListener = function() {
  var self = this;
  var eventType = 'topic';
  self.client.addListener(eventType, function(channel, topic, nick, raw) {
    console.log(eventType.toUpperCase(), arguments);
    self.handle({
      'eventType': eventType,
      'raw': raw,
      'channel': channel,
      'nick': nick,
      'text': topic,
    });
  });
};

module.exports = NodeBot;
