// code to run on server at startup
var irc_params = {
  server: Meteor.settings.server,
  port: 6667,
  nick: Meteor.settings.nickname,
  password: false,
  realname: Meteor.settings.realname,
  username: Meteor.settings.nickname,
  channels: Meteor.settings.channels,
  debug: true,
  stripColors: true
};

insertIrcMessage = function(x) {
  IrcFeed.insert(x);
}

changeNick = function(name) {
  var nick = name ? irc_nickname + '-' + name : irc_nickname;
  irc.send('NICK', nick);
  CURRENT_BAR_NAME = nick;
}

capIrcMessages = function() {
  IrcFeed.find({}, {
    sort: {
      date: -1
    },
    skip: 32
  }).forEach(function(item) {
    IrcFeed.remove(item._id);
  })
}

Meteor.startup(function() {
  irc = new IRC(irc_params);
  irc.connect();
  var query = IRCMessages.find({}, {
    sort: {
      date_time: -1
    }
  });
  var handle = query.observeChanges({
    added: function(id, ircMessageObject) {
      console.log("message added: ", ircMessageObject);

      // {
      //   handle: 'nnnbar',
      //   channel: '#nurdbottest',
      //   text: 'User nooitaf has 73.50 euro cash.',
      //   date_time: Sun Aug 30 2015 13: 11: 10 GMT + 0200(CEST),
      //   action: false,
      //   irc: true,
      //   bot: false,
      //   colour: null
      // }
      var from = ircMessageObject.handle;
      var to = ircMessageObject.channel;
      var message = ircMessageObject.text;

      capIrcMessages();

      insertIrcMessage({
        date: new Date().getTime(),
        from: from,
        to: to,
        message: message
      });

      console.log('from %j to %j : %j', from, to, message)

      if (message) {
        var args = message.split(' ');
        if (args && args.length === 1) {

          if (args[0] === '~help') {
            Meteor.call('help')
          }

          if (args[0] === '~stock') {
            Meteor.call('productList')
          }

          if (args[0] === '~balance') {
            getBalance([from.toLowerCase()]);
          }

          if (args[0] === '~barusers') {
            Meteor.call('userList')
          }

          if (args[0] === '~shame') {
            Meteor.call('hallOfShame')
          }

          if (args[0] === '~transactions') {
            Meteor.call('listTransactions')
          }
        }

        if (args && args.length > 1) {

          if (args[0] === '~stock' && args[1]) {
            var queryList = message.replace('~stock ', '').split(',');
            console.log('query:', args[1], queryList);
            getStock(queryList);
          }

          if (args[0] === '~balance' && args[1]) {
            var queryList = message.replace('~balance ', '').toLowerCase().split(',');
            console.log('balance query:', queryList);
            getBalance(queryList);
          }

          if (args[0] === '~buy' && args[1]) {
            var queryList = message.replace('~buy ', '').split(',');
            console.log('buy query:', queryList);
            getBuy({
              name: from,
              items: queryList
            });
          }
        }
      }
    }
  })
});