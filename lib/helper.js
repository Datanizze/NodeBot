module.exports = {
  startsWith: function(prefix, text) {
    var pattern = new RegExp('^' + prefix, 'i');
    return pattern.test(text);
  }
};
