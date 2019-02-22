module.exports = {
  mariadb: {
    connectionLimit: 10000,
    waitForConnections: true,
    host: '10.1.255.208',
    port: '3337',
    database: 'corp',
    user: 'root',
    password: 'maSHasUraLmaSha'
  },
  adConfig: {
    url: 'ldap://10.1.255.29',
    baseDN: 'dc=elem,dc=ru',
    username: 'gs2@elem.ru',
    password: 'gs2-1'
  },
  mainApi: 'https://apps.elem.ru/corp_api/'
}