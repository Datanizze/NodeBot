module.exports = {
  isCommand: function(commandPrefix, text) {
    if (!(commandPrefix instanceof RegExp)) {
       commandPrefix = new RegExp('^' + commandPrefix, 'i');
    }
    return commandPrefix.test(text);
  }
};
