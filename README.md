# ITALIANO
## pokemongoraid_bot
Pokemon Go Raid Bot è un bot telegram per gestire i raid nei gruppi telegram.

### Installazione e aggiornamento Git e Node.JS
winget install -e --id Git.Git
winget install -e --id OpenJS.NodeJS.LTS
npm install -g npm@latest

#### Se non è ancora stato settato
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

### 1 Installazione delle dipendenze
npm [install | i]

### 2.1 Eseguire il progetto in modalità di produzione
npm run start

### 2.2 Eseguire il progetto in modalità di sviluppo / debug
npm run watch

#### 3 Altri comandi
*Mostra la lista delle dipendenze installate localmente*
npm [list | ls] [--all] <!-- include anche quelle transitive -->

*Mostra i dettagli di una dipendenza richiesta dal package.json*
npm view [name package]

*Mostra i pacchetti obsoleti*
npm outdated

*Aggiorna entro i vincoli semver*
npm update <!-- senza influire il package.json -->

*Controlla le vulnerabilità note*
npm audit

*Riduce duplicazioni nell'albero delle dpendenze*
npm dedupe

# INGLESE
## pokemongoraid_bot
Pokemon Go Raid Bot is a Telegram bot for manager raid in the Telegram group.

### Install and update Git, Node.JS and Npm
winget install -e --id Git.Git
winget install -e --id OpenJS.NodeJS.LTS
npm install -g npm@latest

#### If you missed it
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

### 1 Install the dependencies
npm install

### 2.1 Run the project on production mode
npm run start

### 2.2 Run the project on development / debug mode
npm run watch

#### Other commands
npm outdated 