async function cleanUpOldData() {
  const cutOff = moment().subtract(2, 'hours').toDate().getTime();
  await Promise.all([
    Games.removeAsync({ createdAt: { $lt: cutOff } }),
    Players.removeAsync({ createdAt: { $lt: cutOff } }),
    UserWords.removeAsync({ createdAt: { $lt: cutOff } }),
    Analytics.removeAsync({ createdAt: { $lt: cutOff } }),
  ]);
}

Meteor.startup(async function () {
  // Delete all games and players at startup
  await Promise.all([
    Games.removeAsync({}),
    Players.removeAsync({}),
    UserWords.removeAsync({}),
    Analytics.removeAsync({}),
  ]);
});

Meteor.setInterval(() => {
  cleanUpOldData().catch(error => console.error('Old game cleanup failed', error));
}, 5 * 60 * 1000);

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
