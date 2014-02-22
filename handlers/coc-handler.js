var request = require('request');
var mongo = require('mongoskin');


function CocHandler(cacheTime) {
  'use strict';
  cacheTime = cacheTime * 1000; // seconds to  milliseconds
  // TODO: make these config variables instead.. hard coding sucks
  var baseUrl = 'http://dbwebb.se/coc';

  var mongo_config = {
    host: 'localhost',
    port: '', // 27017 is default
    username: '',
    password: '',
    database: 'wip-cocs'
  };

  var db = mongo.db(getSimpleMongoConnectionString(mongo_config));

  var cocs = db.collection('real-cocs');
  cocs.ensureIndex({'id': 1}, { unique: true, sparse: true}, function(error, result) {
    // TODO: check for errors?
    // We shouldn't have any race conditions here,
    // I highly doubt that getCoc (aka any db action)
    // will occur within the first hundredish milliseconds after the coc handler is initialized
  });

  function getSimpleMongoConnectionString(config) {
    var prefix = 'mongodb://';
    var auth = '';
    var port = '';
    if (config.username && config.password) {
      auth = config.username + ':' + config.password + '@';
    }

    if (config.port) {
      port = ':' + config.port;
    }

    return prefix + auth + config.host + port + '/' + config.database;
  }

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }


  function fetchCoc(cocId, callback) {
    request.get({
      url: baseUrl,
      qs: {
        id: cocId
      }
    }, function(error, response, body) {
      if (error) {
        console.log('COCERROR (REQUEST):', error);
        return;
      }
      var coc = JSON.parse(body);
      // run the callback directly, so user doesn't have to wait for
      // coc to get saved first
      // check if the coc has an id, if not, the coc probably doesn't exist (vague api!)
      if (!coc.id) {
        coc.id = parseFloat(cocId);
      }
      // Save time for when coc was fetched.
      coc.lastFetched = new Date().getTime();

      callback(coc);
    });
  }

  function cacheCoc(coc, callback) {
    cocs.update({'id': coc.id}, coc, {upsert: true}, function (error, result) {
      if (error) {
        console.log('COCERROR (CACHE):', error);
        return;
      }
      if (result) {
        callback(error, coc);
      }
    });
  }

  function fetchAndCacheCoc(cocId, callback) {
    fetchCoc(cocId, function(coc) {
      cacheCoc(coc, callback);
    });
  }

  return function getCoc(cocId, callback) {
    if (!isNumber(cocId)) {
      console.log('Coc number not a number');
      return;
    }

    cocs.findOne({id: parseFloat(cocId)}, function(error, coc) {
      if (error) {
        console.log('COCERROR (MONGO):', error);
        return;
      }
      if (!coc) {
        // We don't have the coc, fetch it and cache it!
        fetchAndCacheCoc(cocId, function(error, result) {
          if (error) {
           console.log('COCERROR (GRAB-IT):', error);
           return;
          }
          callback(result);
        });
      } else {
        // before we return it, check how old it is... if it's older than cacheTime, fetch it agin!
        var lastFetched = coc.lastFetched;
        var now = new Date().getTime();
        if (now - lastFetched > cacheTime) {
          // Cached "for too long", fetch a fresh copy!
          fetchCoc(cocId, function(coc) {
            // callback, save later, consumer goes first!
            callback(coc);
            // save the "new" coc
            cacheCoc(coc, function(error, result) {
              if (!error) {
              }
            });
          });
        } else {
          // cacheTime has not gone by since last time, just run the callback...
          callback(coc);
        }
      }
    });
  };
}

module.exports = CocHandler;
