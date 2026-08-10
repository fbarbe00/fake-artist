function cleanUpOldData(){
  let cutOff = moment().subtract(2, 'hours').toDate().getTime();

  Games.removeAsync({
    createdAt: {$lt: cutOff}
  });

  Players.removeAsync({
    createdAt: {$lt: cutOff}
  });

  UserWords.removeAsync({
    createdAt: {$lt: cutOff}
  });

  Analytics.removeAsync({
    createdAt: {$lt: cutOff}
  });
}

Meteor.startup(function () {
  // Delete all games and players at startup
  Games.removeAsync({});
  Players.removeAsync({});
  UserWords.removeAsync({});
  Analytics.removeAsync({});
});

let MyCron = new Cron(60000);

MyCron.addJob(5, cleanUpOldData);

Meteor.publish('games', function(accessCode) {
  check(accessCode, String);
  if (!/^\d{5}$/.test(accessCode)) {
    return this.ready();
  }
  return Games.find({"accessCode": accessCode});
});

Meteor.publish('players', function(gameID) {
  check(gameID, String);
  return Players.find({"gameID": gameID});
});
