Games = new Mongo.Collection("games");
Players = new Mongo.Collection("players");
UserWords = new Mongo.Collection("userwords");
Analytics = new Mongo.Collection("analytics");

function isSmallDocument(doc) {
  return JSON.stringify(doc).length <= 4096;
}

Games.allow({
  insert: function (userId, doc) {
    return isSmallDocument(doc);
  },
  update: function (userId, doc, fields, modifier) {
    return isSmallDocument(modifier);
  },
  remove: function (userId, doc) {
    return isSmallDocument(doc);
  }
});

Players.allow({
  insert: function (userId, doc) {
    return isSmallDocument(doc);
  },
  update: function (userId, doc, fields, modifier) {
    return isSmallDocument(modifier);
  },
  remove: function (userId, doc) {
    return true;
  }
});

UserWords.allow({
  insert: function (userId, doc) {
    return isSmallDocument(doc);
  },
  update: function (userId, doc, fields, modifier) {
    return isSmallDocument(modifier);
  },
  remove: function (userId, doc) {
    return true;
  }
});

Analytics.allow({
  insert: function (userId, doc) {
    return isSmallDocument(doc);
  },
  update: function (userId, doc, fields, modifier) {
    return isSmallDocument(modifier);
  },
  remove: function (userId, doc) {
    return true;
  }
});

Games.deny({
  insert: function (userId, game) {
    game.createdAt = new Date().valueOf();
    return false;
  }
});

Players.deny({
  insert: function (userId, player) {
    player.createdAt = new Date().valueOf();
    return false;
  }
});

UserWords.deny({
  insert: function (userId, userWord) {
    userWord.createdAt = new Date().valueOf();
    return false;
  }
});

Analytics.deny({
  insert: function (userId, languageUsed) {
    languageUsed.createdAt = new Date().valueOf();
    return false;
  }
});
