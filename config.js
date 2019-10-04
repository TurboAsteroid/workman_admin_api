const path = require('path')

module.exports = {
  mariadb: {
    connectionLimit: 10000,
    waitForConnections: true,
    host: '10.1.255.208',
    port: '3337',
    database: 'corp',
    user: 'root',
    password: 'maSHasUraLmaSha',
    namedPlaceholders: true
  },
  adConfig: {
    url: 'ldap://10.1.255.29',
    baseDN: 'dc=elem,dc=ru',
    username: 'gs2@elem.ru',
    password: 'gs2-1'
  },
  // hostName: 'http://10.1.100.33:3033/',
  hostName: 'http://apps.elem.ru:3033/',
  mainApi: 'https://apps.elem.ru/corp_api/',
  port: 3033,
  jwtSecret: 'sdfgthyujkiolsdkpoifj',
  // imagesPath: path.join(__dirname, '/workman_images/')
  imagesPath: path.join('/usr/src/app/workman_images')
}
