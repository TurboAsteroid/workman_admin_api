#!/usr/bin/env node
let app = require('./app');
let debug = require('debug')('alertnotification:server');
let http = require('http');
let https = require('https');
let fs = require('fs');

// let server = http.createServer(app);

// Starting both http & https servers

var express = require('express');
var app3003 = express();
app3003.use((req, res, next) => {
    res.removeHeader("X-Powered-By"); // чтобы не палить кто сервер
    next();
});
app3003.use(express.static(__dirname+'/app3003_static', { dotfiles: 'allow' } ));
const httpServer3003 = http.createServer(app3003);
httpServer3003.listen(3003, () => {
  console.log('HTTP Server running on port 3003');
});

// Certificate
const privateKey = fs.readFileSync('./alert.elem.ru/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./alert.elem.ru/cert.pem', 'utf8');
const ca = fs.readFileSync('./alert.elem.ru/chain.pem', 'utf8');
const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(3002, () => {
  console.log('HTTPS Server running on port 3002');
});

let io = require('socket.io')(httpsServer);
let usersConnected = 0;
io.on('connection', (socket) => {
  usersConnected++
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
