const crypto = require('crypto')
const nodemailer = require('nodemailer')
const fs = require('fs')
const { promisify } = require('util')
const config = require('../config')
const path = require('path')
var Jimp = require('jimp');

module.exports = {
  genRandomString: function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex') /** convert to hexadecimal format */
      .slice(0, length) /** return required number of characters */
  },
  sha512: function (password, salt = 'defaultSalt') {
    let hash = crypto.createHmac('sha512', salt) /** Hashing algorithm sha512 */
    hash.update(password)
    return hash.digest('hex')
  },
  randomNumber: function (min = 10000, max = 99999) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
  sendEmailMessage: async function (email, message, subject, from) {
    if (!email) {
      return { 'STATUS': 'ERROR', 'message': 'Введите почту.' }
    }
    if (!message) {
      return { 'STATUS': 'ERROR', 'message': 'Введите текст сообщения.' }
    }
    if (!from) {
      return { 'STATUS': 'ERROR', 'message': 'Укажите от кого отправить почту' }
    }

    let transporter = nodemailer.createTransport({
      host: '10.1.255.30',
      port: 25,
      tls: {
        rejectUnauthorized: false
      }
    })
    let mailOptions = {
      from: from,
      to: email,
      subject: subject,
      html: message
    }
    let info = await transporter.sendMail(mailOptions)
    return info
  },
  // blobToFile: function blobToFile(theBlob, fileName){
  //     theBlob.lastModifiedDate = new Date();
  //     theBlob.name = fileName;
  //     return theBlob;
  // }
  readFileAsync: promisify(fs.readFile),
  renameAsync: promisify(fs.rename),
  unlinkAsync: promisify(fs.unlink),
  sizeArray: [ [1080, Jimp.AUTO], [500, Jimp.AUTO], [50, 50] ],
  removeFiles: async function (fileName) {
    for (let i in this.sizeArray) {
      this.unlinkAsync(path.join(config.imagesPath, 'thumbs', `${this.sizeArray[i][0] || ''}_${this.sizeArray[i][1] || ''}`, fileName))
    }
    this.unlinkAsync(path.join(config.imagesPath, 'original', fileName))
  },
  saveAndCrop: async function (file) {
    let filename = `${Date.now()}_${this.genRandomString(10)}.jpg`
    let image = await Jimp.read(`${file.destination}${file.filename}`)
    image.write(path.join(config.imagesPath, 'original', filename))
    for (let i in this.sizeArray) {
      image.resize(...this.sizeArray[i]).quality(81).write(path.join(config.imagesPath, 'thumbs', `${this.sizeArray[i][0] !== Jimp.AUTO ? this.sizeArray[i][0] : ''}_${this.sizeArray[i][1] !== Jimp.AUTO ? this.sizeArray[i][1] : ''}`, filename))
    }
    this.unlinkAsync(path.join(file.destination, file.filename))
    return filename
  },
  getImageLink: async function (filename, size = 'original') {
    return `${config.hostName}routes/file/get/${size}/${filename}`
  }
}
