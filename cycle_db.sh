timestamp=$(date +%s)
mv ./data/current.sqlite3 ./data/session-closed-$timestamp.sqlite3
