const fs = require('fs');
const path = require('path');

// Log file location — Dynatrace will read from here
const LOG_FILE = 'C:\\Projects\\heroverse-store\\logs\\heroverse.log';

// Create logs folder if it doesn't exist
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function createLogger(serviceName) {
  return {
    info: (txnId, msg) => writeLog('INFO', serviceName, txnId, msg),
    error: (txnId, msg) => writeLog('ERROR', serviceName, txnId, msg),
  };
}

function writeLog(level, serviceName, txnId, msg) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} [${txnId}] [${serviceName}] ${level} ${msg}`;

  // Print to terminal as before
  console.log(line);

  // Also write to file
  fs.appendFileSync(LOG_FILE, line + '\n');
}

module.exports = { createLogger };