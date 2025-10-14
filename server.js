const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const { MongoClient } = require('mongodb');
const { getRandomWord } = require('./lib/words');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const FsBackend = require('i18next-fs-backend');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

i18next
  .use(FsBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: __dirname + '/locales/{{lng}}.json',
    },
    fallbackLng: 'en',
    preload: ['en', 'de'],
  });

app.use(i18nextMiddleware.handle(i18next));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.DB_URI || 'mongodb://localhost:27017/fake-artist';

let db;

MongoClient.connect(MONGO_URI)
  .then(client => {
    console.log('Connected to Database');
    db = client.db();
  })
  .catch(error => console.error(error));

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('home', { t: req.t });
});

app.get('/lobby', async (req, res) => {
  const game = await db.collection('games').findOne({ code: req.query.code });
  if (game) {
    res.render('lobby', { game, t: req.t });
  } else {
    res.redirect('/');
  }
});

app.get('/game', async (req, res) => {
  const game = await db.collection('games').findOne({ code: req.query.code });
  if (game) {
    res.render('game', { game, t: req.t });
  } else {
    res.redirect('/');
  }
});

// Data Schemas (for reference)
// Game: { _id, code, players, state, settings, words, category, fakeArtist, confusedArtistWord }
// Player: { _id, name, socketId, isGameMaster }

function generateGameCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on('connection', (socket) => {
  socket.on('joinRoom', (gameCode) => {
    socket.join(gameCode);
  });
  console.log('A user connected');

  socket.on('createGame', async (playerName) => {
    const gameCode = generateGameCode();
    const player = {
      _id: socket.id,
      name: playerName,
      socketId: socket.id,
      isGameMaster: true,
    };
    const game = {
      code: gameCode,
      players: [player],
      state: 'lobby',
      settings: {},
    };
    await db.collection('games').insertOne(game);
    socket.join(gameCode);
    socket.emit('gameCreated', game);
  });

  socket.on('joinGame', async ({ gameCode, playerName }) => {
    const game = await db.collection('games').findOne({ code: gameCode });
    if (game) {
      const player = {
        _id: socket.id,
        name: playerName,
        socketId: socket.id,
        isGameMaster: false,
      };
      await db.collection('games').updateOne(
        { code: gameCode },
        { $push: { players: player } }
      );
      socket.join(gameCode);
      const updatedGame = await db.collection('games').findOne({ code: gameCode });
      io.to(gameCode).emit('playerJoined', updatedGame);
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('startGame', async (gameCode) => {
    const game = await db.collection('games').findOne({ code: gameCode });
    if (game && game.players.find(p => p.socketId === socket.id)?.isGameMaster) {
      let { word, category } = getRandomWord(game.settings.language || 'en', game.settings.category);
      let fakeArtist = null;
      let confusedArtistWord = null;

      // Variant Logic
      if (game.settings.confusedArtist) {
        let secondWord;
        do {
          secondWord = getRandomWord(game.settings.language || 'en', category).word;
        } while (secondWord === word);
        confusedArtistWord = secondWord;
      }
      if (game.settings.allFakeArtists && Math.random() < 0.1) {
        // All players are fake artists
      } else if (game.settings.noFakeArtist && Math.random() < 0.1) {
        // No fake artist
      } else {
        if (game.settings.betterStart) {
          const nonFirstPlayers = game.players.slice(1);
          fakeArtist = nonFirstPlayers[Math.floor(Math.random() * nonFirstPlayers.length)];
        } else {
          fakeArtist = game.players[Math.floor(Math.random() * game.players.length)];
        }
      }

      await db.collection('games').updateOne(
        { code: gameCode },
        { $set: {
            state: 'playing',
            word,
            category,
            fakeArtistId: fakeArtist ? fakeArtist._id : null,
            confusedArtistWord,
            timer: 300 // 5 minutes
          }
        }
      );

      const timer = setInterval(async () => {
        const game = await db.collection('games').findOne({ code: gameCode });
        if (game && game.state === 'playing' && game.timer > 0) {
          await db.collection('games').updateOne({ code: gameCode }, { $inc: { timer: -1 } });
          io.to(gameCode).emit('timerUpdate', game.timer - 1);
        } else {
          clearInterval(timer);
          io.to(gameCode).emit('timerExpired');
        }
      }, 1000);

      const updatedGame = await db.collection('games').findOne({ code: gameCode });

      // Emit roles to each player individually
      updatedGame.players.forEach(player => {
        let role = 'artist';
        let wordToSend = word;
        if (fakeArtist && player._id === fakeArtist._id) {
          role = 'fake-artist';
          wordToSend = null;
        }
        if (confusedArtistWord && player._id !== fakeArtist._id) {
            // Randomly assign the confused artist word to one of the real artists
            if(Math.random() < 1 / (updatedGame.players.length-1)){
                wordToSend = confusedArtistWord;
            }
        }

        io.to(player.socketId).emit('gameStarted', {
          ...updatedGame,
          role,
          word: wordToSend,
        });
      });
    }
  });

  socket.on('removePlayer', async ({ gameCode, playerId }) => {
    const game = await db.collection('games').findOne({ code: gameCode });
    const remover = game.players.find(p => p.socketId === socket.id);

    if (game && remover && remover.isGameMaster) {
      await db.collection('games').updateOne(
        { code: gameCode },
        { $pull: { players: { _id: playerId } } }
      );
      const updatedGame = await db.collection('games').findOne({ code: gameCode });
      io.to(gameCode).emit('playerLeft', updatedGame);
      // We also need to kick the player from the room/redirect them
      const removedPlayerSocket = io.sockets.sockets.get(playerId);
      if(removedPlayerSocket) {
        removedPlayerSocket.emit('kicked');
      }
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected');
    const game = await db.collection('games').findOne({ "players.socketId": socket.id });
    if (game) {
      await db.collection('games').updateOne(
        { code: game.code },
        { $pull: { players: { socketId: socket.id } } }
      );
      const updatedGame = await db.collection('games').findOne({ code: game.code });
      if (updatedGame.players.length === 0) {
        await db.collection('games').deleteOne({ code: game.code });
      } else {
        io.to(game.code).emit('playerLeft', updatedGame);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
