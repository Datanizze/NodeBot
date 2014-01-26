var _ = require('underscore');
var util = require('util');
var async = require('async');


/**
 * Removes a module from the cache
 */
function uncacheModule(moduleName) {
  // Run over the cache looking for the files
  // loaded by the specified module name
  require.searchCache(moduleName, function (mod) {
    delete require.cache[mod.id];
  });
}

/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
  // Resolve the module identified by the specified name
  var mod = require.resolve(moduleName);

  // Check if the module has been resolved and found within
  // the cache
  if (mod && ((mod = require.cache[mod]) !== undefined)) {
    // Recursively go over the results
    (function run(mod) {
      // Go over each of the module's children and
      // run over it
      mod.children.forEach(function (child) {
          run(child);
      });

      // Call the specified callback providing the
      // found module
      callback(mod);
    })(mod);
  }
};



// Define the function (class)
var IrcHandler = function(ircClient, permissions) {
  'use strict';
  var self = this;

  self.client = ircClient;
  self.client.setMaxListeners(20);

  self.permissions = permissions;
  self.plugins = {}; // name and plugin object
  self.enabledPlugins = []; // name only
  self.disabledPlugins = []; // name only

  self.availableListeners = [
    'Error', 'Invite', 'Join',
    'Kick', 'Kill', 'Message',
    'MMode', 'Nick', 'Notice',
    'Part', 'Ping', 'Pm',
    'PMode', 'Quit', 'Topic'
  ];

  self.enableAllListeners();
};

////////////////
// Prototypes //
////////////////

// makes a reguire call to load the plugin and
// registers what messages it want to listen to
IrcHandler.prototype.loadPlugin = function(name, pluginPath) {
  var self = this;
  console.log('Loading plugin "' + name + '" [' + pluginPath + ']');
  // TODO: handle errors like pluginPath == nonexistent
  var Plugin = require(pluginPath);
  this.plugins[name] = {
    'plugin': new Plugin(self),
    'path': pluginPath
  };
  // Attach the handlerto the plugin for extended (undocumented) access to the handler
  this.plugins[name].handler = self;
  this.enabledPlugins.push(name);
};

IrcHandler.prototype.reloadPlugin = function(name) {
  // Does the plugin exist?
  if (!this.plugins[name]) {
    console.log('No plugin loaded called', name ,'found');
    return false;
  }
  var pluginPath = this.plugins[name].path;
  this.removePlugin(name);
  // Delete the module from the require cache.. (fingers crossed no memory leaks)
  uncacheModule(pluginPath);
  // Is this delete necessary? If I understand things correctly the old plugin will be GC'd
  // automatically since it's no longer referenced when assigning the reloaded.
  this.loadPlugin(name, pluginPath);
};

// activates all listeners for plugin, needs to be registered.
IrcHandler.prototype.enablePlugin = function(name) {
  // TODO: optimize by checking which listeners the plugin wants and cache that
  //       so we don't need to loop over each plugin every time something happens.
  var pluginIndex = this.disabledPlugins.indexOf(name);
  if (pluginIndex !== -1) {
    this.disabledPlugins.splice(pluginIndex, 1);
  }
};

// disables the plugin by not calling it.
IrcHandler.prototype.disablePlugin = function(name) {
  var pluginIndex = this.enabledPlugins.indexOf(name);
  if (pluginIndex !== -1) {
    this.disabledPlugins.push(name);
  }
};

// removes the plugin completly
IrcHandler.prototype.removePlugin = function(name) {
  this.disablePlugin(name);
  // removing a plugin will not remove it from the "disabled" plugins...
  // so if you're adding it again later don't forget to enable it.
  var pluginIndex = this.enabledPlugins.indexOf(name);
  if (pluginIndex !== -1) {
    this.enabledPlugins.splice(pluginIndex, 1);
  }
  delete this.plugins[name];
};

IrcHandler.prototype.enableAllListeners = function() {
  var self = this;
  _.each(self.availableListeners, function(listener) {
    console.log('Enabling Listener: %s', listener);
    self['toggle' + listener + 'Listener'](true);
  });
};







// TODO: add permissions handling.
IrcHandler.prototype.handleMessage = function(type, matchTargets, callback) {
  var self = this;
  async.each(self.enabledPlugins, function(pluginName) {
    var listener = self.plugins[pluginName].plugin[type];
    // Check if plugin listens for joins
    if (typeof listener !== 'undefined') {
      if (self.shouldRespond(listener.match, matchTargets)) {
        callback(listener.handler, pluginName);
      }
    }
  });
};


IrcHandler.prototype.shouldRespond = function(matcher, targets) {
  var matched = false;
  var self = this;
  // Check if match exist, if it doesn't, we assume the plugin creator
  // didn't want to write a match if he/she/it wants to listen to all joins.
  if (targets instanceof Array) {
    var i = 0;
    while (!matched && i < targets.length) {
      matched = self.shouldRespond(matcher, targets[i++]);
    }
    return matched;
  }

  if (matcher instanceof Array) {
    var j = 0;
    while (!matched && j < matcher.length) {
      matched = self.shouldRespond(matcher[j++], targets);
    }
  } else if (typeof matcher === 'undefined') {
    matched = true;
  } else if (typeof matcher == 'boolean') {
    matched = matcher;
  } else if (matcher instanceof RegExp) {
    matched = matcher.test(targets);
  } else if (typeof matcher == "string" ) {
    matched = (targets.indexOf(matcher) !== -1);
  }
  return matched;
};


IrcHandler.prototype.toggleJoinListener = function(state) {
  var self = this;
  var callback = function(channel, nick, message) {
    console.log('join', channel, nick);
    // Don't do anything if the bot is the one who is joining
    if (nick == self.client.nick) {
      return false;
    }

    self.handleMessage('join', [channel, nick], function(handler) {
      var response = handler(channel, nick, message);
      self.client.say(response.to, response.message);
    });
  };

  if (state) {
    this.client.addListener('join', callback);
  } else {
    this.client.removeListener('join', callback);
  }
};

IrcHandler.prototype.toggleNoticeListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('notice');
  };

  if (state) {
    this.client.addListener('notice', callback);
  } else {
    this.client.removeListener('notice', callback);
  }
};

IrcHandler.prototype.toggleErrorListener = function(state) {
  var self = this;
  var callback = function(message) {
    console.log('error', message);

  };

  if (state) {
    this.client.addListener('error', callback);
  } else {
    this.client.removeListener('error', callback);
  }
};

IrcHandler.prototype.toggleTopicListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('topic');
  };

  if (state) {
    this.client.addListener('topic', callback);
  } else {
    this.client.removeListener('topic', callback);
  }
};

IrcHandler.prototype.togglePartListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('part');
  };

  if (state) {
    this.client.addListener('part', callback);
  } else {
    this.client.removeListener('part', callback);
  }
};

IrcHandler.prototype.toggleQuitListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('quit');
  };

  if (state) {
    this.client.addListener('quit', callback);
  } else {
    this.client.removeListener('quit', callback);
  }
};

IrcHandler.prototype.toggleKickListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('kick');
  };

  if (state) {
    this.client.addListener('kick', callback);
  } else {
    this.client.removeListener('kick', callback);
  }
};

IrcHandler.prototype.toggleKillListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('kill');
  };

  if (state) {
    this.client.addListener('kill', callback);
  } else {
    this.client.removeListener('kill', callback);
  }
};

IrcHandler.prototype.toggleMessageListener = function(state) {
  var self = this;
  var callback = function(from, to, message, raw) {
    console.log('message', from, to, message);

    self.handleMessage('message', [from, to, message], function(handler, pluginName) {
      var response = handler(from, to, message);
      if (response && response.to && response.message) {
        self.client.say(response.to, response.message);
      } else {
        console.log(pluginName, 'operated in silence');
      }
    });
  };

  if (state) {
    this.client.addListener('message', callback);
  } else {
    this.client.removeListener('message', callback);
  }
};

IrcHandler.prototype.togglePingListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('ping');
  };

  if (state) {
    this.client.addListener('ping', callback);
  } else {
    this.client.removeListener('ping', callback);
  }
};

IrcHandler.prototype.togglePmListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('pm');
  };

  if (state) {
    this.client.addListener('pm', callback);
  } else {
    this.client.removeListener('pm', callback);
  }
};

IrcHandler.prototype.toggleNickListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('nick');
  };

  if (state) {
    this.client.addListener('nick', callback);
  } else {
    this.client.removeListener('nick', callback);
  }
};

IrcHandler.prototype.toggleInviteListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('invite');
  };

  if (state) {
    this.client.addListener('invite', callback);
  } else {
    this.client.removeListener('invite', callback);
  }
};

IrcHandler.prototype.togglePModeListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('+mode');
  };

  if (state) {
    this.client.addListener('+mode', callback);
  } else {
    this.client.removeListener('+mode', callback);
  }
};

IrcHandler.prototype.toggleMModeListener = function(state) {
  var self = this;
  var callback = function() {
    console.log('-mode');
  };

  if (state) {
    this.client.addListener('-mode', callback);
  } else {
    this.client.removeListener('-mode', callback);
  }
};


// handles an incoming message, checks if there are any plugins that
// wants to act upon the message.

/*

[
  // message types, all case insensitive
  'join': {
    'match: ['just', 'specify', 'nicks', 'you', 'want', 'to', 'act', 'upon', 'regex', 'works'],
    'func': function(...)
  },
  'part': {
    'match': ['same as join'],
    'func': function(...)
  },
  'message': {
    'beginsWith': {
      'match' : ['only do stuff if', ' message starts with this'],
      'func': function(...)
    }, and so on....
    'endsWith': ['only do stuff', 'if', 'messag ends with this'],
    'contains': ['capture this, regardless of', 'position in message']
  }
]

*/



exports.IrcHandler = IrcHandler;
