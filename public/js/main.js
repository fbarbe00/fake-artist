const socket = io();

// Home page elements
const startMenu = document.getElementById('start-menu');
const createGameForm = document.getElementById('create-game-form');
const joinGameForm = document.getElementById('join-game-form');
const btnNewGame = document.getElementById('btn-new-game');
const btnJoinGame = document.getElementById('btn-join-game');
const createGameFormEl = document.getElementById('create-game');
const joinGameFormEl = document.getElementById('join-game');

if (startMenu) {
  btnNewGame.addEventListener('click', () => {
    startMenu.style.display = 'none';
    createGameForm.style.display = 'block';
  });

  btnJoinGame.addEventListener('click', () => {
    startMenu.style.display = 'none';
    joinGameForm.style.display = 'block';
  });

  createGameFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const playerName = document.getElementById('create-player-name').value;
    if (playerName) {
      socket.emit('createGame', playerName);
    }
  });

  joinGameFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const gameCode = document.getElementById('join-game-code').value;
    const playerName = document.getElementById('join-player-name').value;
    if (gameCode && playerName) {
      socket.emit('joinGame', { gameCode, playerName });
    }
  });
}

// Lobby page elements
const playerList = document.getElementById('player-list');
const btnStartGame = document.getElementById('btn-start-game');

function updatePlayerList(game) {
  if (playerList) {
    playerList.innerHTML = '';
    game.players.forEach(player => {
      const li = document.createElement('li');
      let html = player.name;
      if (player.isGameMaster) {
        html += ` (${window.translations.questionMasterIndicator})`;
      } else if (game.players.find(p => p.socketId === socket.id)?.isGameMaster) {
        html += ` <button class="btn-remove-player" data-player-id="${player._id}">${window.translations.remove}</button>`;
      }
      li.innerHTML = html;
      playerList.appendChild(li);
    });
    // Re-add event listeners for the new remove buttons
    document.querySelectorAll('.btn-remove-player').forEach(button => {
      button.addEventListener('click', (e) => {
        const playerId = e.target.dataset.playerId;
        const urlParams = new URLSearchParams(window.location.search);
        const gameCode = urlParams.get('code');
        socket.emit('removePlayer', { gameCode, playerId });
      });
    });
  }
}

socket.on('connect', () => {
  if (playerList) {
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('code');

    socket.emit('joinRoom', gameCode);

    if (btnStartGame) {
      const currentPlayer = window.game.players.find(p => p.socketId === socket.id);
      if (currentPlayer && currentPlayer.isGameMaster) {
        btnStartGame.style.display = 'block';
      }

      btnStartGame.addEventListener('click', () => {
        socket.emit('startGame', gameCode);
      });
    }
    updatePlayerList(window.game);
  }
});


// Game page elements
const gameInfo = document.getElementById('game-info');
if (gameInfo) {
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get('code');
  socket.emit('joinRoom', gameCode);
}


// Socket event listeners
socket.on('gameCreated', (game) => {
  window.location.href = `/lobby?code=${game.code}`;
});

socket.on('playerJoined', (game) => {
  if (playerList) {
    updatePlayerList(game);
  } else {
    // Redirect to lobby if not already there
    window.location.href = `/lobby?code=${game.code}`;
  }
});

socket.on('playerLeft', (game) => {
  if (playerList) {
    updatePlayerList(game);
  }
});

socket.on('gameStarted', (data) => {
  if (window.location.pathname !== '/game') {
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('code');
    window.location.href = `/game?code=${gameCode}`;
  }

  const playerRole = document.getElementById('player-role');
  const gameCategory = document.getElementById('game-category');
  const gameWord = document.getElementById('game-word');

  playerRole.textContent = data.role;
  gameCategory.textContent = data.category;
  gameWord.textContent = data.word || '???';
});

socket.on('timerUpdate', (time) => {
  const timer = document.getElementById('timer');
  if (timer) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
});

socket.on('timerExpired', () => {
  const timer = document.getElementById('timer');
  if (timer) {
    timer.textContent = 'Time\'s up!';
  }
});

socket.on('kicked', () => {
  alert('You have been kicked from the game.');
  window.location.href = '/';
});

socket.on('error', (message) => {
  alert(message);
});
