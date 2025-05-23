FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Construction avec le mode production pour optimiser le build
RUN npm run build

FROM nginx:alpine

# Correction du chemin de sortie selon angular.json
COPY --from=build /app/dist/tradetracker /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
