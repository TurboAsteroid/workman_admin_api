#!/usr/bin/env node

/**
 * Module dependencies.
 */

let app = require('./app');
let debug = require('debug')('alertnotification:server');
let http = require('http');
let https = require('https');
let fs = require('fs');

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

// let server = https.createServer({
//     key: fs.readFileSync('cert/server.key'),
//     cert: fs.readFileSync('cert/server.pem')
// }, app).listen(port);

let server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
let io = require('socket.io')(server);


let usersConnected = 0;
io.on('connection', (socket) => {
    console.log(new Date() + ' ::: user connected. ip: ' + socket.handshake.address + ' total connected user(s): ' + usersConnected);
    socket.on('disconnect', () => {
        usersConnected--;
        console.log(new Date() + ' ::: user disconnected. ip: ' + socket.handshake.address + ' total connected user(s): ' + usersConnected);
    });
});
app.set('io', io);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
