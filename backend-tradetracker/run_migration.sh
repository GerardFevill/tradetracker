#!/bin/bash
# Script pour exécuter la migration SQL

# Exécuter le script SQL avec les paramètres de connexion
PGPASSWORD=tradetracker psql -h localhost -p 7432 -U tradetracker -d tradetracker -f src/migrations/add_initial_capital_column.sql

# Afficher un message de confirmation
echo "Migration terminée. Vérification de la structure de la table accounts :"
PGPASSWORD=tradetracker psql -h localhost -p 7432 -U tradetracker -d tradetracker -c "\d accounts"
