# Utilisation d'une image Node.js en tant que base
FROM node:latest

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et le package-lock.json (s'ils existent) dans le conteneur
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application dans le conteneur
COPY . .

# Exécuter les tests
CMD ["npm", "test"]
