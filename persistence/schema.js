module.exports = [
  'CREATE TABLE IF NOT EXISTS sensorEvents (' +
    'sessionId INTEGER NOT NULL, ' + 
    'timestamp INTEGER NOT NULL, ' +
    'sensor TEXT NOT NULL, ' +
    'data TEXT NOT NULL);',

  'CREATE TABLE IF NOT EXISTS sessions (' +
    'sessionId INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'startTimestamp INTEGER UNIQUE NOT NULL, ' +
    'endTimestamp INTEGER NOT NULL, ' +
    'name TEXT);'];