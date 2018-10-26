#!/usr/bin/env node
let app = require('./app');
let debug = require('debug')('alertnotification:server');
let https = require('https');
let fs = require('fs');
let express = require('express');
let helper = require('./routes/helper');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/apps.elem.ru/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/apps.elem.ru/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/apps.elem.ru/chain.pem', 'utf8');

// const privateKey = fs.readFileSync('./apps.elem.ru/privkey1.pem', 'utf8');
// const certificate = fs.readFileSync('./apps.elem.ru/cert1.pem', 'utf8');
// const ca = fs.readFileSync('./apps.elem.ru/chain1.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};
const server = https.createServer(credentials, app);
server.listen(3002, () => {
  console.log('HTTPS Server running on port 3002');
});

let io = require('socket.io')(server);
let usersConnected = 0;
io.on('connection', async (socket) => {
  usersConnected++;
  console.log(new Date() + ' ::: user connected. ip: ' + socket.handshake.address + ' total connected user(s): ' + usersConnected);
  socket.on('disconnect', () => {
      usersConnected--;
      console.log(new Date() + ' ::: user disconnected. ip: ' + socket.handshake.address + ' total connected user(s): ' + usersConnected);
  });
  socket.emit('incidents', await helper.getAllIncidents(app.get('mysql_config')));
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
