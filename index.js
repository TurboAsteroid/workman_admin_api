#!/usr/bin/env node

/**
 * Module dependencies.
 */

let app = require('./app')
let debug = require('debug')('corp-api:server')
let config = require('./config')
let http = require('http')
let https = require('https')
let fs = require('fs')

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || config.port || '3033')
app.set('port', port)

/**
 * Create HTTP server.
 */

// let server = http.createServer(app)

const credentials = {
  key: fs.readFileSync('/etc/letsencrypt/live/apps.elem.ru/privkey.pem', 'utf8'),
  cert: fs.readFileSync('/etc/letsencrypt/live/apps.elem.ru/cert.pem', 'utf8'),
  ca: fs.readFileSync('/etc/letsencrypt/live/apps.elem.ru/chain.pem', 'utf8')
}

let server = https.createServer(credentials, app)

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort (val) {
  let port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening () {
  let addr = server.address()
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  debug('Listening on ' + bind)
}
