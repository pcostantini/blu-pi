timestamp=$(date +"%Y-%m-%d-%H%M")
echo "cycling db to session-$timestamp.sqlite3"

mv ./data/current.sqlite3 ./data/session-$timestamp.sqlite3
