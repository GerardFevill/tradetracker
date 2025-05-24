#!/bin/bash

# Création du répertoire pour les certificats
mkdir -p /home/vagrant/workspace/windsurf/tradetracker/nginx/ssl

# Génération d'un certificat auto-signé pour le développement avec le nom d'hôte tradetracker.local
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /home/vagrant/workspace/windsurf/tradetracker/nginx/ssl/nginx.key \
  -out /home/vagrant/workspace/windsurf/tradetracker/nginx/ssl/nginx.crt \
  -subj "/C=FR/ST=Paris/L=Paris/O=TradeTracker/CN=tradetracker.local" \
  -addext "subjectAltName=DNS:tradetracker.local,DNS:www.tradetracker.local"

echo "Certificats SSL générés avec succès pour tradetracker.local !"
echo "N'oubliez pas d'exécuter le script setup-hosts.sh pour configurer votre fichier hosts."
