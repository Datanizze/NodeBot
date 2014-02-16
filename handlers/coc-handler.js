var request = require('request');

var baseUrl = 'http://dbwebb.se/coc';

// TODO: add local DB caching...
// TOOD: add local db suggestions box.
// TODO: handle  non-existent cocs

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports.getCoc = function(cocNumber, callback) {
  if (!isNumber(cocNumber)) {
    console.log('Coc number not a number');
  }

  request.get({
    url: baseUrl,
    qs: {
      id: cocNumber
    }
  }, function(error, response, body) {
    callback(JSON.parse(body));
  });
};
