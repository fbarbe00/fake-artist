# A Fake Artist Goes to New York
![Logo](public/img/logo-en.png)

This player aid for A Fake Artist Goes to New York eliminates the need for a Question master and lets everyone participate.

It is based on [Evan Brumley's](https://github.com/evanbrumley) Spyfall game.

The original boardgame at BoardGameGeek: https://boardgamegeek.com/boardgame/135779/fake-artist-goes-new-york

This fork runs on current Node and Meteor releases in a small, non-root Docker image.

# Running Your Copy (with Docker)
Set `ROOT_URL` to your public HTTPS address in `docker-compose.yml`, then run:

`docker compose up --build -d`

The web service listens on `127.0.0.1:40` for use behind a reverse proxy. MongoDB is available only inside the Compose network. Games are intentionally kept in memory and reset on restart.

# Translation
The translation has two parts: the user interface and the words list.
Word lists are in `lib/`. Add a new list to `getWordsProvider()` in `client/main.js`.
UI translations are in `public/translations/`. Copy `en.json`, rename it with the language code, translate its values, and add the language in `lib/i18n.js`.


# Credits
I can code but can't draw, so all the art of the game come from the artists of [The Noun Project](https://thenounproject.com/)
Art by Will Deskins from the Noun Project
Fake Mustache by Claire Jones from the Noun Project
Salvador Dali by Simon Child from the Noun Project

Translators:
* [Johannes Fischer](https://github.com/JohannesFischer)
* [Raphael Alexio](https://github.com/raphaelaleixo)
* [Francesco T](https://www.boardgamegeek.com/user/omnigod)
* [Camilo Sampedro](https://github.com/camilosampedro)
* [Fabio Barbero](https://fabiobarbero.eu)
