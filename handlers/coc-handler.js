var request = require('request');
var mongo = require('mongoskin');

var baseUrl = 'http://dbwebb.se/coc';

var db = mongo.db('mongodb://localhost/wip-cocs');

var cachePeriod = 3600000; // an hour in milliseconds
var cocs = db.collection('real-cocs');

cocs.ensureIndex({"id": 1}, { unique: true, sparse: true}, function(error, result) {
  // TODO: check for errors?
  // We shouldn't have any race conditions here,
  // I highly doubt that getCoc (aka any db action)
  // will occur within the first hundredish milliseconds after the coc handler is initialized
});


function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


function fetchCoc(cocNumber, callback) {
  request.get({
    url: baseUrl,
    qs: {
      id: cocNumber
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
      coc.id = parseFloat(cocNumber);
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

function fetchAndCacheCoc(cocNumber, callback) {
  fetchCoc(cocNumber, function(coc) {
    cacheCoc(coc, callback);
  });
}



function getCoc(cocNumber, callback) {
  if (!isNumber(cocNumber)) {
    console.log('Coc number not a number');
    return;
  }

  cocs.findOne({id: parseFloat(cocNumber)}, function(error, coc) {
    if (error) {
      console.log('COCERROR (MONGO):', error);
      return;
    }
    if (!coc) {
      // We don't have the coc, fetch it and cache it!
      fetchAndCacheCoc(cocNumber, function(error, result) {
        if (error) {
         console.log('COCERROR (GRAB-IT):', error);
         return;
        }
        callback(result);
      });
    } else {
      // before we return it, check how old it is... if it's older than cachePeriod, fetch it agin!
      var lastFetched = coc.lastFetched;
      var now = new Date().getTime();
      if (now - lastFetched > cachePeriod) {
        // Cached "for too long", fetch a fresh copy!
        fetchCoc(cocNumber, function(coc) {
          // callback, save later, consumer goes first!
          callback(coc);
          // save the "new" coc
          cacheCoc(coc, function(error, result) {
            if (!error) {
            }
          });
        });
      } else {
        // cachePeriod has not gone by since last time, just run the callback...
        callback(coc);
      }
    }
  });
}

module.exports.getCoc = getCoc;
