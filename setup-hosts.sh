#!/bin/bash

# Script pour configurer le fichier hosts avec le nom d'hôte tradetracker.local

# Vérification des privilèges administrateur
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté avec des privilèges administrateur (sudo)."
  echo "Utilisation: sudo $0"
  exit 1
fi

# Adresse IP locale
IP="127.0.0.1"

# Noms d'hôte à ajouter
HOSTNAME="tradetracker.local"
WWW_HOSTNAME="www.tradetracker.local"

# Vérification si les entrées existent déjà
if grep -q "$HOSTNAME" /etc/hosts; then
  echo "L'entrée pour $HOSTNAME existe déjà dans le fichier hosts."
else
  # Ajout des entrées au fichier hosts
  echo -e "\n# TradeTracker application" >> /etc/hosts
  echo "$IP $HOSTNAME $WWW_HOSTNAME" >> /etc/hosts
  echo "Entrées ajoutées avec succès au fichier hosts:"
  echo "$IP $HOSTNAME $WWW_HOSTNAME"
fi

echo -e "\nConfiguration terminée. Vous pouvez maintenant accéder à l'application via:"
echo "https://$HOSTNAME"
echo "https://$WWW_HOSTNAME"
