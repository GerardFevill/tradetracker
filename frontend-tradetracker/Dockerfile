FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Construction avec le mode production pour optimiser le build
RUN npm run build --configuration=production

FROM nginx:alpine

# Installation d'OpenSSL pour générer des certificats
RUN apk add --no-cache openssl

# Création du répertoire pour les certificats SSL
RUN mkdir -p /etc/nginx/ssl

# Génération de certificats auto-signés pour le développement
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=TradeTracker/CN=tradetracker.local" \
    -addext "subjectAltName=DNS:tradetracker.local,DNS:www.tradetracker.local"

# Correction du chemin de sortie selon angular.json
COPY --from=build /app/dist/tradetracker /usr/share/nginx/html

# Copie de la configuration Nginx mise à jour
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposition des ports HTTP et HTTPS
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
