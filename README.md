# HoodHelps
## _Des voisins qui s'entraident._

Bienvenue dans HoodHelps, la plateforme qui rapproche les voisins pour créer des quartiers plus forts et plus solidaires. Nous croyons en la puissance de la communauté, et c'est pourquoi nous avons créé un espace où les voisins peuvent se réunir, s'entraider et découvrir les talents cachés de leur quartier.

Avec HoodHelps, vous pouvez rejoindre ou créer un groupe de résidents de votre quartier, et c'est au sein de ces groupes que l'entraide commence. Seuls les membres du groupe ont accès aux compétences et métiers des autres résidents, ce qui facilite la recherche de personnes compétentes pour diverses tâches et projets.

Que vous ayez besoin d'un plombier, d'un professeur de musique ou d'un jardinier, vous trouverez des voisins talentueux prêts à vous aider. Et si vous avez des compétences à offrir, c'est l'endroit idéal pour les partager et contribuer à rendre votre quartier encore meilleur.

Rejoignez HoodHelps aujourd'hui et faites partie d'une communauté de voisins bienveillants qui s'entraident pour créer des quartiers plus solides. Ensemble, nous pouvons bâtir un environnement où chaque voisin se sent soutenu et valorisé.


## Tech
[ReactJS]: <https://react.dev/>
[Storybook]: <https://storybook.js.org/>
[ExpressJS]: <https://expressjs.com/fr/>
[Socket.IO]: <https://socket.io/>
[Styled-Components]: <https://styled-components.com/>
[nodeJS]: <https://nodejs.org/>
[Swagger]: <https://swagger.io/tools/swaggerhub/>
[PostgreSql]: <https://www.postgresql.org/>
[Docker]: <https://www.docker.com/>

HoodHelps uses a number of open source projects to work properly:

- [ExpressJS] - Fast, unopinionated, minimalist web framework for Node.js
- [nodeJS] - evented I/O for the backend
- [Swagger] - The Single Source of Truth for API Development
- [PostgreSql] - The World's Most Advanced Open Source Relational Database
- [Docker] - Accelerated Container Application Development

## GitHub
[Repository](https://github.com/nansou13/hoodhelp/)
## Installation

### back-end API
Package installation and running
```sh
cd serverAPI
npm install
yarn start
```

> Note: Documentation [http://localhost:5100/docs/#/](http://localhost:5100/docs/#/)

### DataBase

HoodHelps requires [Docker](https://www.docker.com/) to run.

create a docker volume named `dbapp`
```sh
docker volume create dbapp
```

Run the docker compose database
```sh
cd database
docker-compose up -d --force-recreate
```

### CI

Run the docker compose jest test with memory database
```sh
cd ./
docker-compose up --build
```

Mandatory env var 
```sh
ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}
REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
FIREBASE_SERVICE_ACCOUNT_KEY: ${FIREBASE_SERVICE_ACCOUNT_KEY}
```

### Env var 

```sh
ACCESS_TOKEN_SECRET=xxxxxxxxxxxxx
REFRESH_TOKEN_SECRET=xxxxxxxxxxxxxxx

DEV=1
DATABASE_URL=postgresql://xxx:yyyy@localhost:5432/app

MAILTRAP_USER = mail@mail.fr
MAILTRAP_PASSWORD = password
```