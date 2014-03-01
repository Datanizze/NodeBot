// See https://node-irc.readthedocs.org/en/latest/API.html#client for node-irc's options
module.exports = {
  server: '',
  nick: '',
  options: {
    channels: [],
    userName: '',
    realName: ''
  },
  cocs: {
    cacheTime: 6 * 60 * 60, // 6 hours
  }
};
