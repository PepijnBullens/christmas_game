# Javascript Christmas Game

A JavaScript ice hockey video game, made for a school project by [Pepijn](https://github.com/PepijnBullens) and [Noah](https://github.com/NoahMelle). For this project, we primarily used Next.js (v15), Matter.js and Colyseus.js. Go check it out!

# Table of contents

- [Javascript Christmas Game](#javascript-christmas-game)
- [Table of contents](#table-of-contents)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [License](#license)

# Prerequisites

To be able to run this project locally, you will need a few pieces of software installed:

-   `Node.js` (tested on v20.x.x)
-   `npm` (or any other JavaScript package manager of choice)

# Installation

[(Back to top)](#table-of-contents)

1. Clone the GitHub repo by running this command in your desired directory:
    ```bash
    git clone https://github.com/PepijnBullens/christmas_game.git
    ```
2. Navigate to the cloned directory:
    ```bash
    cd christmas_game
    ```
3. Install the required dependencies in the root directory and all subdirectories by running this command:
    ```bash
    npm run install:all
    ```
4. Run both projects simultaneously using this command:

    ```bash
    npm run dev:all
    ```

    This will run both the game itself, and the websocket server to supply the multiplayer functionality.

5. Head over to http://localhost:3000 to play the game locally, have fun!

# License

[(Back to top)](#table-of-contents)

The MIT License (MIT) 2024 - [Pepijn](https://github.com/PepijnBullens) and [Noah](https://github.com/NoahMelle). Please have a look at the [LICENSE.txt](LICENSE.txt) for more details.
